import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { buildPromptLegacy, type ArtStyleId } from '@/lib/prompts/artStyles'
import { generateBodySchema, validationErrorResponse } from '@/lib/api-schemas'
import { generatePortraitFromReference } from '@/lib/ai/gpt-image'
import { checkJsonBodySize } from '@/lib/api-limits'
import { getGuestBalance, deductGuestToken } from '@/lib/tokens/guest-tokens'
import { getUserBalance, deductUserToken } from '@/lib/tokens/user-tokens'
import {
  GUEST_ID_COOKIE,
  GUEST_ID_COOKIE_MAX_AGE,
  isDevGuest,
  isDevGuestWithActiveSession,
  isDevUser,
  DEV_CREDITS_BALANCE,
  DEV_USER_CREDITS,
  DEV_GUEST_ACTIVE_COOKIE,
  POST_LOGOUT_COOKIE,
} from '@/lib/tokens/constants'
import { canUseFreeGeneration, recordFreeGenerationUseFromRequest } from '@/lib/tokens/guest-abuse-prevention'
import { getPackBalance, deductPackGeneration } from '@/lib/pack-credits'
import { getClientIp } from '@/lib/request-utils'
import { serverErrorResponse } from '@/lib/api-error'
import { isOpenAIProvider } from '@/lib/image-provider'
import { checkRateLimit } from '@/lib/rate-limit'
import { DEFAULT_COOKIE_OPTIONS } from '@/lib/cookie-utils'

const INSUFFICIENT_CREDITS_MESSAGE =
  "You've used your 2 free portraits. Sign in to get more, or buy Portrait Generations."

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
  // Apply rate limiting (in addition to credit-based limiting)
  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(clientIp, request.nextUrl.pathname)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many generation attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfterSeconds.toString(),
        },
      }
    )
  }
  const sizeError = checkJsonBodySize(request)
  if (sizeError) return sizeError

  const user = await getOptionalUser()
  const cookieStore = await cookies()

  // Post-logout: no credits, block generation. Prevents bypassing UI "0 credits" state.
  if (!user && cookieStore.get(POST_LOGOUT_COOKIE)?.value === '1') {
    return NextResponse.json(
      { error: INSUFFICIENT_CREDITS_MESSAGE, code: 'INSUFFICIENT_CREDITS' },
      { status: 403 }
    )
  }

  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const isNewGuest = !guestId
  if (!guestId) guestId = crypto.randomUUID()
  const hasDevGuestActive = cookieStore.get(DEV_GUEST_ACTIVE_COOKIE)?.value === '1'

  const supabase = createClientIfConfigured()

  /** When logged in, use user id as session and user_token_usage for balance/deduct. */
  const sessionId = user ? user.id : guestId

  let balance: number
  if (user && isDevUser(user.email)) {
    balance = DEV_USER_CREDITS
  } else if (user && supabase) {
    try {
      const [userResult, packResult] = await Promise.all([
        getUserBalance(supabase, user.id),
        getPackBalance(supabase, user.id),
      ])
      balance = userResult.balance + packResult.generationsRemaining
    } catch {
      balance = 0
    }
  } else if (isDevGuestWithActiveSession(guestId, cookieStore.get(DEV_GUEST_ACTIVE_COOKIE)?.value === '1')) {
    balance = DEV_CREDITS_BALANCE
  } else if (supabase) {
    try {
      const result = await getGuestBalance(supabase, guestId, {
        isDevGuestSession: hasDevGuestActive,
      })
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

  const userAgent = request.headers.get('user-agent') ?? null
  const acceptLanguage = request.headers.get('accept-language') ?? null
  if (!user && !isDevGuestWithActiveSession(guestId, hasDevGuestActive)) {
    try {
      const allowedByAbuseCap = await canUseFreeGeneration(supabase, clientIp, userAgent, acceptLanguage)
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
  const { imageUrl, imageUrls, artStyle, subjectType, petType, colorPalette, idempotencyKey: bodyKey } = parsed.data
  const idempotencyKey = bodyKey ?? request.headers.get('idempotency-key')?.trim()?.slice(0, 255) ?? null
  const dbSubjectType =
    subjectType === 'pet' && petType ? `pet_${petType}` : subjectType

  // Resolve reference URLs: use imageUrls for multi-photo, else imageUrl
  const referenceUrls = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : []
  const primaryImageUrl = referenceUrls[0]
  if (!primaryImageUrl) {
    return NextResponse.json(
      { error: 'Missing imageUrl or imageUrls', code: 'VALIDATION_ERROR' },
      { status: 400 }
    )
  }

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from('generations')
      .select('id, job_id')
      .eq('idempotency_key', idempotencyKey)
      .eq('session_id', sessionId)
      .maybeSingle()
    if (existing) {
      return NextResponse.json(
        {
          error: 'Duplicate request. Use the existing generation.',
          code: 'IDEMPOTENCY_CONFLICT',
          generationId: existing.id,
          jobId: existing.job_id ?? `openai-${existing.id}`,
        },
        { status: 409 }
      )
    }
  }

  let deducted: boolean
  if (user && isDevUser(user.email)) {
    deducted = true
  } else if (user) {
    try {
      deducted = await deductUserToken(supabase, user.id)
      if (!deducted) {
        deducted = await deductPackGeneration(supabase, user.id)
      }
    } catch (e) {
      console.error('Token/pack deduct failed:', e)
      return NextResponse.json(
        { error: 'Unable to process. Please try again.', code: 'DEDUCT_FAILED' },
        { status: 503 }
      )
    }
  } else {
    try {
      deducted = await deductGuestToken(supabase, guestId, {
        isDevGuestSession: hasDevGuestActive,
      })
    } catch (e) {
      console.error('deductGuestToken failed:', e)
      return NextResponse.json(
        { error: 'Unable to process. Please try again.', code: 'DEDUCT_FAILED' },
        { status: 503 }
      )
    }
    if (!deducted) {
      return NextResponse.json(
        { error: INSUFFICIENT_CREDITS_MESSAGE, code: 'INSUFFICIENT_CREDITS' },
        { status: 403 }
      )
    }
  }

  if (!deducted) {
    return NextResponse.json(
      { error: INSUFFICIENT_CREDITS_MESSAGE, code: 'INSUFFICIENT_CREDITS' },
      { status: 403 }
    )
  }

  try {
    const prompt = buildPromptLegacy(
      artStyle as ArtStyleId,
      subjectType,
      petType,
      referenceUrls.length >= 2 ? referenceUrls.length : undefined,
      colorPalette
    )

    const insertPayload: Record<string, unknown> = {
      session_id: sessionId,
      original_image_url: primaryImageUrl,
      art_style: artStyle,
      subject_type: dbSubjectType,
      prompt: prompt,
      status: 'pending',
    }
    if (referenceUrls.length >= 2) {
      insertPayload.reference_image_urls = referenceUrls
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
          .select('id, job_id')
          .eq('idempotency_key', idempotencyKey)
          .maybeSingle()
        if (existing) {
          return NextResponse.json(
            {
              error: 'Duplicate request. Use the existing generation.',
              code: 'IDEMPOTENCY_CONFLICT',
              generationId: existing.id,
              jobId: existing.job_id ?? `openai-${existing.id}`,
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
      // For non-OpenAI generation, create stub job ID
      jobId = `stub-${gen.id}`
      status = 'generating'
    }

    await supabase
      .from('generations')
      .update({
        job_id: jobId,
        status: status === 'generating' ? 'generating' : 'pending',
      })
      .eq('id', gen.id)

    if (!user) {
      try {
        await recordFreeGenerationUseFromRequest(supabase, clientIp, userAgent, acceptLanguage)
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
        ...DEFAULT_COOKIE_OPTIONS,
        maxAge: GUEST_ID_COOKIE_MAX_AGE,
      })
    }
    return res
  } catch (e) {
    return serverErrorResponse(e, 'Generate')
  }
}
