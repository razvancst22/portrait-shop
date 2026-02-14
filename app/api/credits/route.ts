import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getGuestBalance } from '@/lib/tokens/guest-tokens'
import {
  getGuestBalanceFromCookie,
  setGuestBalanceCookie,
  setGuestIdCookie,
} from '@/lib/tokens/guest-tokens-cookie'
import { GUEST_ID_COOKIE, GUEST_TOKENS_INITIAL } from '@/lib/tokens/constants'

/**
 * GET /api/credits – return current token balance.
 * Uses Supabase when configured; otherwise cookie-only (no DB).
 */
export async function GET() {
  const cookieStore = await cookies()
  let guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const isNewGuest = !guestId
  if (!guestId) {
    guestId = crypto.randomUUID()
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
