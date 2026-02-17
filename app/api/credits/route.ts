import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { getGuestBalance } from '@/lib/tokens/guest-tokens'
import { getUserBalance } from '@/lib/tokens/user-tokens'
import {
  getGuestBalanceFromCookie,
  setGuestBalanceCookie,
  setGuestIdCookie,
} from '@/lib/tokens/guest-tokens-cookie'
import { GUEST_ID_COOKIE, GUEST_TOKENS_INITIAL, isDevGuest, isDevUser, DEV_CREDITS_BALANCE, DEV_USER_CREDITS } from '@/lib/tokens/constants'

/**
 * GET /api/credits – return current token balance.
 * Logged-in user: balance from user_token_usage (per account). Dev user gets 1000.
 * Guest: balance from guest_token_usage or cookie. Dev guest gets unlimited.
 */
export async function GET() {
  const user = await getOptionalUser()
  if (user) {
    if (isDevUser(user.email)) {
      return NextResponse.json({
        balance: DEV_USER_CREDITS,
        isGuest: false,
        isNewGuest: false,
      })
    }
    const supabase = createClientIfConfigured()
    if (supabase) {
      try {
        const result = await getUserBalance(supabase, user.id)
        return NextResponse.json({
          balance: result.balance,
          isGuest: false,
          isNewGuest: false,
        })
      } catch {
        // fall through to guest path if user_token_usage fails
      }
    }
  }

  const cookieStore = await cookies()
  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const isNewGuest = !guestId
  if (!guestId) {
    guestId = crypto.randomUUID()
  }

  if (isDevGuest(guestId)) {
    return NextResponse.json({
      balance: DEV_CREDITS_BALANCE,
      isGuest: true,
      isNewGuest: false,
    })
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

  const res = NextResponse.json({
    balance,
    isGuest: true,
    isNewGuest,
  })

  if (isNewGuest) {
    setGuestIdCookie(res, guestId)
  }
  if (!supabase && isNewGuest) {
    setGuestBalanceCookie(res, GUEST_TOKENS_INITIAL)
  }

  return res
}
