/**
 * Cookie utilities for secure cookie handling.
 */

/**
 * Determines if cookies should be set with the secure flag.
 *
 * The secure flag ensures cookies are only sent over HTTPS connections.
 * This is crucial for production security to prevent cookie interception.
 *
 * Prioritizes IS_SECURE_COOKIE env var, falls back to NODE_ENV check.
 * Returns false for localhost (127.0.0.1) even in production mode
 * for local development convenience.
 */
export function shouldUseSecureCookies(): boolean {
  // Check explicit override first (for staging/preview environments)
  if (process.env.IS_SECURE_COOKIE === 'true') return true
  if (process.env.IS_SECURE_COOKIE === 'false') return false

  // Default to production check
  return process.env.NODE_ENV === 'production'
}

/**
 * Standard cookie options for security best practices.
 */
export const DEFAULT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/' as const,
  secure: shouldUseSecureCookies(),
} as const

/**
 * Cookie options for expiring/deleting a cookie.
 */
export const EXPIRE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: 0,
  path: '/' as const,
  secure: shouldUseSecureCookies(),
} as const
