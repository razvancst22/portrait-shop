/** Number of free tokens every guest gets (no login required). */
export const GUEST_TOKENS_INITIAL = 2

/** Cookie name for anonymous guest id (HTTP-only, used when Supabase is available). */
export const GUEST_ID_COOKIE = 'guest_id'

/** Cookie name for guest balance when Supabase is not used (cookie-only fallback). */
export const GUEST_BALANCE_COOKIE = 'guest_tokens_remaining'

/** Cookie max age: 1 year. */
export const GUEST_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Unlimited credits for dev. Set DEV_GUEST_ID in .env.local and use /api/dev/set-dev-cookie to activate. */
export const DEV_CREDITS_BALANCE = 9999

/** Short-lived cookie (1h) – 9999 bonus only applies when this is present. Prevents stale dev cookie from lasting forever. */
export const DEV_GUEST_ACTIVE_COOKIE = 'dev_guest_active'
export const DEV_GUEST_ACTIVE_MAX_AGE = 60 * 60 // 1 hour

/** Cookie set on logout – when present, credits API returns 0 (no auto new-guest). Prevents "2 credits back" after logout. */
export const POST_LOGOUT_COOKIE = 'post_logout'
export const POST_LOGOUT_MAX_AGE = 60 * 60 // 1 hour

export function isDevGuest(guestId: string | undefined): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  const devId = process.env.DEV_GUEST_ID?.trim()
  return !!devId && !!guestId && guestId === devId
}

/** True only when guest_id matches DEV_GUEST_ID AND dev_guest_active cookie is present. Prevents 9999 from persisting after dev session. */
export function isDevGuestWithActiveSession(
  guestId: string | undefined,
  hasDevGuestActiveCookie: boolean
): boolean {
  return isDevGuest(guestId) && hasDevGuestActiveCookie
}

/** Dev user gets 1000 credits. Set DEV_USER_EMAIL in .env.local (e.g. office@crwd.ro). */
export const DEV_USER_CREDITS = 1000

export function isDevUser(email: string | undefined): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  const devEmail = process.env.DEV_USER_EMAIL?.trim()?.toLowerCase()
  return !!devEmail && !!email && email.toLowerCase() === devEmail
}
