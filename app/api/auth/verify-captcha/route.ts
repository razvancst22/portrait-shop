import { NextRequest, NextResponse } from 'next/server'

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY

/**
 * Verifies a Cloudflare Turnstile token.
 * Returns { valid: boolean }.
 * When TURNSTILE_SECRET_KEY is not set, returns { valid: true } (opt-in: no verification).
 */
export async function POST(request: NextRequest) {
  if (!TURNSTILE_SECRET) {
    return NextResponse.json({ valid: true })
  }

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  const token = body?.token
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
      }),
    })

    const data = (await res.json()) as { success?: boolean }
    const valid = !!data?.success

    return NextResponse.json({ valid })
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
