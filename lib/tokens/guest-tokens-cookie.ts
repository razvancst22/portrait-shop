import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { GUEST_TOKENS_INITIAL, GUEST_BALANCE_COOKIE, GUEST_ID_COOKIE, GUEST_ID_COOKIE_MAX_AGE } from './constants'

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: GUEST_ID_COOKIE_MAX_AGE,
  path: '/' as const,
  secure: process.env.NODE_ENV === 'production',
}

/**
 * Get guest token balance from cookie only (no Supabase).
 * Returns GUEST_TOKENS_INITIAL if cookie missing or invalid.
 */
export function getGuestBalanceFromCookie(cookieStore: ReadonlyRequestCookies): number {
  const raw = cookieStore.get(GUEST_BALANCE_COOKIE)?.value
  const n = parseInt(raw ?? '', 10)
  if (Number.isNaN(n) || n < 0 || n > GUEST_TOKENS_INITIAL) {
    return GUEST_TOKENS_INITIAL
  }
  return n
}

/**
 * Deduct one token in cookie. Returns true if had balance and deducted; false otherwise.
 * Caller must set the cookie on the response with setGuestBalanceCookie.
 */
export function deductGuestTokenCookie(cookieStore: ReadonlyRequestCookies): {
  success: boolean
  newBalance: number
} {
  const current = getGuestBalanceFromCookie(cookieStore)
  if (current < 1) {
    return { success: false, newBalance: 0 }
  }
  return { success: true, newBalance: current - 1 }
}

export function setGuestBalanceCookie(
  res: { cookies: { set: (name: string, value: string, opts: object) => void } },
  balance: number
) {
  res.cookies.set(GUEST_BALANCE_COOKIE, String(Math.max(0, Math.min(balance, GUEST_TOKENS_INITIAL))), COOKIE_OPTS)
}

export function setGuestIdCookie(
  res: { cookies: { set: (name: string, value: string, opts: object) => void } },
  guestId: string
) {
  res.cookies.set(GUEST_ID_COOKIE, guestId, COOKIE_OPTS)
}
