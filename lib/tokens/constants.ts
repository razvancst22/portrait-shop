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

export function isDevGuest(guestId: string | undefined): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  const devId = process.env.DEV_GUEST_ID?.trim()
  return !!devId && !!guestId && guestId === devId
}

/** Dev user gets 1000 credits. Set DEV_USER_EMAIL in .env.local (e.g. office@crwd.ro). */
export const DEV_USER_CREDITS = 1000

export function isDevUser(email: string | undefined): boolean {
  if (process.env.NODE_ENV !== 'development') return false
  const devEmail = process.env.DEV_USER_EMAIL?.trim()?.toLowerCase()
  return !!devEmail && !!email && email.toLowerCase() === devEmail
}
