import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import {
  isAllowedArtStyle,
  isAllowedPetType,
  isAllowedSubjectType,
  buildPrompt,
  type ArtStyleId,
  type PetTypeId,
  type SubjectTypeId,
} from '@/lib/prompts/artStyles'
import { startGeneration } from '@/lib/ai/midjourney'
import { checkJsonBodySize } from '@/lib/api-limits'
import { getGuestBalance, deductGuestToken } from '@/lib/tokens/guest-tokens'
import {
  deductGuestTokenCookie,
  setGuestBalanceCookie,
  setGuestIdCookie,
} from '@/lib/tokens/guest-tokens-cookie'
import { GUEST_ID_COOKIE, GUEST_ID_COOKIE_MAX_AGE } from '@/lib/tokens/constants'

const INSUFFICIENT_CREDITS_MESSAGE =
  "You've used your 2 free portraits. Sign in to get more, or buy credits."

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

  const cookieStore = await cookies()
  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const isNewGuest = !guestId
  if (!guestId) guestId = crypto.randomUUID()

  const supabase = createClientIfConfigured()

  let balance: number
  if (supabase) {
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

  let deducted: boolean
  let cookieBalanceAfterDeduct: number | null = null
  try {
    deducted = await deductGuestToken(supabase, guestId)
  } catch {
    const result = deductGuestTokenCookie(cookieStore)
    deducted = result.success
    if (result.success) cookieBalanceAfterDeduct = result.newBalance
  }

  if (!deducted) {
    return NextResponse.json(
      { error: INSUFFICIENT_CREDITS_MESSAGE, code: 'INSUFFICIENT_CREDITS' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { imageUrl, artStyle, subjectType, petType } = body as {
      imageUrl?: string
      artStyle?: string
      subjectType?: string
      petType?: string
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageUrl' },
        { status: 400 }
      )
    }
    if (!isAllowedArtStyle(artStyle ?? '')) {
      return NextResponse.json(
        { error: 'Invalid artStyle. Allowed: renaissance, baroque, victorian, regal, belle_epoque' },
        { status: 400 }
      )
    }
    const resolvedSubjectType: SubjectTypeId = isAllowedSubjectType(subjectType ?? 'pet')
      ? (subjectType as SubjectTypeId)
      : 'pet'
    const resolvedPetType =
      resolvedSubjectType === 'pet' && petType && isAllowedPetType(petType)
        ? (petType as PetTypeId)
        : undefined

    const prompt = buildPrompt(
      artStyle as ArtStyleId,
      resolvedSubjectType,
      resolvedPetType
    )

    const sessionId = guestId

    const dbSubjectType =
      resolvedSubjectType === 'pet' && resolvedPetType
        ? `pet_${resolvedPetType}`
        : resolvedSubjectType

    const { data: gen, error: insertError } = await supabase
      .from('generations')
      .insert({
        session_id: sessionId,
        original_image_url: imageUrl,
        art_style: artStyle,
        subject_type: dbSubjectType,
        midjourney_prompt: prompt,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !gen) {
      console.error('Insert generation error:', insertError)
      return NextResponse.json(
        { error: insertError?.message ?? 'Failed to create generation' },
        { status: 500 }
      )
    }

    const { jobId, status } = await startGeneration({
      imageUrl,
      artStyle: artStyle as ArtStyleId,
      subjectType: resolvedSubjectType,
      petType: resolvedPetType,
    })

    await supabase
      .from('generations')
      .update({
        midjourney_job_id: jobId,
        status: status === 'generating' ? 'generating' : 'pending',
      })
      .eq('id', gen.id)

    const res = NextResponse.json({
      generationId: gen.id,
      jobId,
    })
    if (isNewGuest) {
      res.cookies.set(GUEST_ID_COOKIE, guestId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: GUEST_ID_COOKIE_MAX_AGE,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      })
    }
    if (cookieBalanceAfterDeduct !== null) {
      setGuestBalanceCookie(res, cookieBalanceAfterDeduct)
    }
    return res
  } catch (e) {
    console.error('Generate error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
