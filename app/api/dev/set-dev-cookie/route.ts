import { NextRequest, NextResponse } from 'next/server'
import { GUEST_ID_COOKIE, GUEST_ID_COOKIE_MAX_AGE } from '@/lib/tokens/constants'

/**
 * GET /api/dev/set-dev-cookie – set guest_id to DEV_GUEST_ID for unlimited credits.
 * Only works when NODE_ENV=development and DEV_GUEST_ID is set in .env.local.
 */
export async function GET(request: NextRequest) {
  const devId = process.env.DEV_GUEST_ID?.trim()
  if (process.env.NODE_ENV !== 'development' || !devId) {
    return NextResponse.json(
      { error: 'Dev cookie only available in development with DEV_GUEST_ID set.' },
      { status: 403 }
    )
  }

  const origin = request.nextUrl.origin
  const res = NextResponse.redirect(new URL('/', origin))
  res.cookies.set(GUEST_ID_COOKIE, devId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: GUEST_ID_COOKIE_MAX_AGE,
    path: '/',
    secure: false,
  })

  return res
}
