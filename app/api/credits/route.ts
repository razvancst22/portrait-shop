import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { getGuestBalance } from '@/lib/tokens/guest-tokens'
import { getUserBalance } from '@/lib/tokens/user-tokens'
import { getPackBalance } from '@/lib/pack-credits'
import {
  getGuestBalanceFromCookie,
  setGuestBalanceCookie,
  setGuestIdCookie,
} from '@/lib/tokens/guest-tokens-cookie'
import {
  GUEST_ID_COOKIE,
  GUEST_TOKENS_INITIAL,
  isDevGuest,
  isDevGuestWithActiveSession,
  isDevUser,
  DEV_CREDITS_BALANCE,
  DEV_USER_CREDITS,
  DEV_GUEST_ACTIVE_COOKIE,
  POST_LOGOUT_COOKIE,
} from '@/lib/tokens/constants'

/**
 * GET /api/credits – return current token balance.
 * Logged-in user: balance from user_token_usage (per account). Dev user gets 1000.
 * Guest: balance from guest_token_usage or cookie. Dev guest gets unlimited.
 */
export async function GET() {
  const user = await getOptionalUser()
  if (user) {
    if (isDevUser(user.email)) {
      return NextResponse.json(
        { balance: DEV_USER_CREDITS, isGuest: false, isNewGuest: false },
        { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
      )
    }
    const supabase = createClientIfConfigured()
    if (supabase) {
      try {
        const [userResult, packResult] = await Promise.all([
          getUserBalance(supabase, user.id),
          getPackBalance(supabase, user.id),
        ])
        return NextResponse.json(
          {
            balance: userResult.balance + packResult.generationsRemaining,
            isGuest: false,
            isNewGuest: false,
          },
          { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
        )
      } catch {
        // fall through to guest path if user_token_usage fails
      }
    }
  }

  const cookieStore = await cookies()

  // Post-logout: return 0, do NOT create new guest. Prevents "2 credits back" after logout.
  if (cookieStore.get(POST_LOGOUT_COOKIE)?.value === '1') {
    return NextResponse.json(
      { balance: 0, isGuest: true, isNewGuest: false },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    )
  }

  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const isNewGuest = !guestId
  if (!guestId) {
    guestId = crypto.randomUUID()
  }

  const hasDevGuestActive = cookieStore.get(DEV_GUEST_ACTIVE_COOKIE)?.value === '1'
  if (isDevGuestWithActiveSession(guestId, hasDevGuestActive)) {
    return NextResponse.json(
      { balance: DEV_CREDITS_BALANCE, isGuest: true, isNewGuest: false },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    )
  }

  const supabase = createClientIfConfigured()
  let balance: number

  if (supabase) {
    try {
      const result = await getGuestBalance(supabase, guestId)
      balance = result.balance
    } catch {
      balance = getGuestBalanceFromCookie(cookieStore)
    }
  } else {
    balance = getGuestBalanceFromCookie(cookieStore)
  }

  const res = NextResponse.json(
    { balance, isGuest: true, isNewGuest },
    { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
  )

  if (isNewGuest) {
    setGuestIdCookie(res, guestId)
  }
  if (!supabase && isNewGuest) {
    setGuestBalanceCookie(res, GUEST_TOKENS_INITIAL)
  }

  return res
}
