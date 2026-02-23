import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import {
  GUEST_TOKENS_INITIAL,
  GUEST_BALANCE_COOKIE,
  GUEST_ID_COOKIE,
  GUEST_ID_COOKIE_MAX_AGE,
  DEV_GUEST_ACTIVE_COOKIE,
  POST_LOGOUT_COOKIE,
  POST_LOGOUT_MAX_AGE,
} from './constants'
import { DEFAULT_COOKIE_OPTIONS, EXPIRE_COOKIE_OPTIONS } from '@/lib/cookie-utils'

const COOKIE_OPTS = {
  ...DEFAULT_COOKIE_OPTIONS,
  maxAge: GUEST_ID_COOKIE_MAX_AGE,
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

/** Cookie options to expire/delete a cookie (maxAge: 0). */
// Re-using EXPIRE_COOKIE_OPTIONS from cookie-utils.ts

/** Post-logout cookie: 1h expiry so credits API returns 0 instead of creating new guest. */
const POST_LOGOUT_COOKIE_OPTS = {
  ...DEFAULT_COOKIE_OPTIONS,
  maxAge: POST_LOGOUT_MAX_AGE,
}

/**
 * Clear guest cookies and set post_logout on the response (on logout).
 * When post_logout is present, credits API returns 0 – no auto new-guest.
 */
export function clearGuestCookies(
  res: { cookies: { set: (name: string, value: string, opts: object) => void } }
) {
  res.cookies.set(GUEST_ID_COOKIE, '', EXPIRE_COOKIE_OPTIONS)
  res.cookies.set(GUEST_BALANCE_COOKIE, '', EXPIRE_COOKIE_OPTIONS)
  res.cookies.set(DEV_GUEST_ACTIVE_COOKIE, '', EXPIRE_COOKIE_OPTIONS)
  res.cookies.set(POST_LOGOUT_COOKIE, '1', POST_LOGOUT_COOKIE_OPTS)
}

/**
 * Expire all guest and post-logout cookies (e.g. after successful login/signup).
 * Use when linking guest to user so guest_id is cleared and post_logout removed.
 */
export function expireGuestAndPostLogoutCookies(
  res: { cookies: { set: (name: string, value: string, opts: object) => void } }
) {
  res.cookies.set(GUEST_ID_COOKIE, '', EXPIRE_COOKIE_OPTIONS)
  res.cookies.set(GUEST_BALANCE_COOKIE, '', EXPIRE_COOKIE_OPTIONS)
  res.cookies.set(DEV_GUEST_ACTIVE_COOKIE, '', EXPIRE_COOKIE_OPTIONS)
  res.cookies.set(POST_LOGOUT_COOKIE, '', EXPIRE_COOKIE_OPTIONS)
}
