import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { buildPrompt } from '@/lib/prompts/artStyles'
import { generateBodySchema, validationErrorResponse } from '@/lib/api-schemas'
import { startGeneration } from '@/lib/ai/midjourney'
import { checkJsonBodySize } from '@/lib/api-limits'
import { getGuestBalance, deductGuestToken } from '@/lib/tokens/guest-tokens'
import { getUserBalance, deductUserToken } from '@/lib/tokens/user-tokens'
import {
  deductGuestTokenCookie,
  setGuestBalanceCookie,
  setGuestIdCookie,
} from '@/lib/tokens/guest-tokens-cookie'
import { GUEST_ID_COOKIE, GUEST_ID_COOKIE_MAX_AGE, isDevGuest, isDevUser, DEV_CREDITS_BALANCE, DEV_USER_CREDITS } from '@/lib/tokens/constants'
import { canUseFreeGeneration, recordFreeGenerationUseFromRequest } from '@/lib/tokens/guest-abuse-prevention'
import { getClientIp } from '@/lib/request-utils'
import { serverErrorResponse } from '@/lib/api-error'
import { isOpenAIProvider } from '@/lib/image-provider'

const INSUFFICIENT_CREDITS_MESSAGE =
  "You've used your 2 free portraits. Sign in to get more, or buy credits."

const ABUSE_CAP_MESSAGE =
  "You've used your free portraits for this device and network. Sign in for more, or try again in 30 days."

const SUPABASE_REQUIRED_MESSAGE =
  'Supabase not configured. Run migration and set NEXT_PUBLIC_SUPABASE_URL (and keys) to enable generation.'

/**
 * POST /api/generate – create generations row and start AI job (or stub).
 * Deducts 1 guest token; returns 403 if no tokens remaining.
 * Without Supabase: returns 503 (no token deducted).
 */
export async function POST(request: NextRequest) {
  const sizeError = checkJsonBodySize(request)
  if (sizeError) return sizeError

  const user = await getOptionalUser()
  const cookieStore = await cookies()
  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const isNewGuest = !guestId
  if (!guestId) guestId = crypto.randomUUID()

  const supabase = createClientIfConfigured()

  /** When logged in, use user id as session and user_token_usage for balance/deduct. */
  const sessionId = user ? user.id : guestId

  let balance: number
  if (user && isDevUser(user.email)) {
    balance = DEV_USER_CREDITS
  } else if (user && supabase) {
    try {
      const result = await getUserBalance(supabase, user.id)
      balance = result.balance
    } catch {
      balance = 0
    }
  } else if (isDevGuest(guestId)) {
    balance = DEV_CREDITS_BALANCE
  } else if (supabase) {
    try {
      const result = await getGuestBalance(supabase, guestId)
      balance = result.balance
    } catch {
      const { getGuestBalanceFromCookie } = await import('@/lib/tokens/guest-tokens-cookie')
      balance = getGuestBalanceFromCookie(cookieStore)
    }
  } else {
    const { getGuestBalanceFromCookie } = await import('@/lib/tokens/guest-tokens-cookie')
    balance = getGuestBalanceFromCookie(cookieStore)
  }

  if (balance < 1) {
    return NextResponse.json(
      { error: INSUFFICIENT_CREDITS_MESSAGE, code: 'INSUFFICIENT_CREDITS' },
      { status: 403 }
    )
  }

  if (!supabase) {
    return NextResponse.json(
      { error: SUPABASE_REQUIRED_MESSAGE, code: 'SUPABASE_NOT_CONFIGURED' },
      { status: 503 }
    )
  }

  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') ?? null
  const acceptLanguage = request.headers.get('accept-language') ?? null
  if (!user && !isDevGuest(guestId)) {
    try {
      const allowedByAbuseCap = await canUseFreeGeneration(supabase, ip, userAgent, acceptLanguage)
      if (!allowedByAbuseCap) {
        return NextResponse.json(
          { error: ABUSE_CAP_MESSAGE, code: 'FREE_CAP_30_DAYS' },
          { status: 403 }
        )
      }
    } catch (e) {
      console.error('Abuse prevention check failed (fail open):', e)
    }
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_JSON' },
      { status: 400 }
    )
  }
  const parsed = generateBodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      validationErrorResponse(parsed.error),
      { status: 400 }
    )
  }
  const { imageUrl, artStyle, subjectType, petType, idempotencyKey: bodyKey } = parsed.data
  const idempotencyKey = bodyKey ?? request.headers.get('idempotency-key')?.trim()?.slice(0, 255) ?? null
  const dbSubjectType =
    subjectType === 'pet' && petType ? `pet_${petType}` : subjectType

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('generations')
      .select('id, midjourney_job_id')
      .eq('idempotency_key', idempotencyKey)
      .eq('session_id', sessionId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json(
        {
          error: 'Duplicate request. Use the existing generation.',
          code: 'IDEMPOTENCY_CONFLICT',
          generationId: existing.id,
          jobId: existing.midjourney_job_id ?? `openai-${existing.id}`,
        },
        { status: 409 }
      )
    }
  }

  let deducted: boolean
  let cookieBalanceAfterDeduct: number | null = null
  if (user && isDevUser(user.email)) {
    deducted = true
  } else if (user) {
    deducted = await deductUserToken(supabase, user.id)
  } else {
    try {
      deducted = await deductGuestToken(supabase, guestId)
    } catch {
      const result = deductGuestTokenCookie(cookieStore)
      deducted = result.success
      if (result.success) cookieBalanceAfterDeduct = result.newBalance
    }
  }

  if (!deducted) {
    return NextResponse.json(
      { error: INSUFFICIENT_CREDITS_MESSAGE, code: 'INSUFFICIENT_CREDITS' },
      { status: 403 }
    )
  }

  try {
    const prompt = buildPrompt(artStyle, subjectType, petType)

    const insertPayload: Record<string, unknown> = {
      session_id: sessionId,
      original_image_url: imageUrl,
      art_style: artStyle,
      subject_type: dbSubjectType,
      midjourney_prompt: prompt,
      status: 'pending',
    }
    if (idempotencyKey) insertPayload.idempotency_key = idempotencyKey

    const { data: gen, error: insertError } = await supabase
      .from('generations')
      .insert(insertPayload)
      .select('id')
      .single()

    if (insertError) {
      if (insertError.code === '23505' && idempotencyKey) {
        const { data: existing } = await supabase
          .from('generations')
          .select('id, midjourney_job_id')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle()
        if (existing) {
          return NextResponse.json(
            {
              error: 'Duplicate request. Use the existing generation.',
              code: 'IDEMPOTENCY_CONFLICT',
              generationId: existing.id,
              jobId: existing.midjourney_job_id ?? `openai-${existing.id}`,
            },
            { status: 409 }
          )
        }
      }
      return serverErrorResponse(insertError, 'Insert generation')
    }
    if (!gen) {
      return serverErrorResponse(new Error('No generation returned'), 'Insert generation')
    }

    let jobId: string
    let status: 'pending' | 'generating'
    if (isOpenAIProvider()) {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI image provider is configured but OPENAI_API_KEY is not set.', code: 'PROVIDER_CONFIG' },
          { status: 503 }
        )
      }
      jobId = `openai-${gen.id}`
      status = 'generating'
    } else {
      const result = await startGeneration({
        imageUrl,
        artStyle,
        subjectType,
        petType,
      })
      jobId = result.jobId
      status = result.status
    }

    await supabase
      .from('generations')
      .update({
        midjourney_job_id: jobId,
        status: status === 'generating' ? 'generating' : 'pending',
      })
      .eq('id', gen.id)

    if (!user) {
      try {
        await recordFreeGenerationUseFromRequest(supabase, ip, userAgent, acceptLanguage)
      } catch (e) {
        console.error('Abuse prevention record failed (non-blocking):', e)
      }
    }

    const res = NextResponse.json({
      generationId: gen.id,
      jobId,
    })
    if (!user && isNewGuest) {
      res.cookies.set(GUEST_ID_COOKIE, guestId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: GUEST_ID_COOKIE_MAX_AGE,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      })
    }
    if (!user && cookieBalanceAfterDeduct !== null) {
      setGuestBalanceCookie(res, cookieBalanceAfterDeduct)
    }
    return res
  } catch (e) {
    return serverErrorResponse(e, 'Generate')
  }
}
