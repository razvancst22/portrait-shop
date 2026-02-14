/** Number of free tokens every guest gets (no login required). */
export const GUEST_TOKENS_INITIAL = 2

/** Cookie name for anonymous guest id (HTTP-only, used when Supabase is available). */
export const GUEST_ID_COOKIE = 'guest_id'

/** Cookie name for guest balance when Supabase is not used (cookie-only fallback). */
export const GUEST_BALANCE_COOKIE = 'guest_tokens_remaining'

/** Cookie max age: 1 year. */
export const GUEST_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
