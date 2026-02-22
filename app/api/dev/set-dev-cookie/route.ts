import { NextRequest, NextResponse } from 'next/server'
import {
  GUEST_ID_COOKIE,
  GUEST_ID_COOKIE_MAX_AGE,
  DEV_GUEST_ACTIVE_COOKIE,
  DEV_GUEST_ACTIVE_MAX_AGE,
} from '@/lib/tokens/constants'

/**
 * GET /api/dev/set-dev-cookie – set guest_id to DEV_GUEST_ID + dev_guest_active for unlimited credits.
 * The 9999 bonus only lasts 1h (dev_guest_active). Visit this route again to re-activate.
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
  res.cookies.set(DEV_GUEST_ACTIVE_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: DEV_GUEST_ACTIVE_MAX_AGE,
    path: '/',
    secure: false,
  })

  return res
}
