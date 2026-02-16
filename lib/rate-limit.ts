/**
 * In-memory rate limiter for API routes (per IP + path).
 * Use for: /api/upload, /api/generate, /api/checkout, /api/order-lookup.
 * For multi-instance production, replace with Redis (e.g. Upstash) or similar.
 */

const WINDOW_MS = 60 * 1000 // 1 minute

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

/** Limits (requests per minute per IP) per path prefix */
export const LIMITS: Record<string, number> = {
  '/api/upload': 15,
  '/api/generate': 10,
  '/api/checkout': 5,
  '/api/order-lookup': 5,
}

/** GET /api/generate/[id]/preview – 60/min per IP */
const PREVIEW_PATH_REGEX = /^\/api\/generate\/[^/]+\/preview$/

function getLimit(pathname: string): number {
  if (PREVIEW_PATH_REGEX.test(pathname)) return 60
  for (const [prefix, limit] of Object.entries(LIMITS)) {
    if (pathname.startsWith(prefix)) return limit
  }
  return 60 // default
}

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

/**
 * Returns { allowed, retryAfterSeconds }.
 * If allowed is false, client should get 429 and Retry-After: retryAfterSeconds.
 */
export function checkRateLimit(ip: string, pathname: string): { allowed: boolean; retryAfterSeconds: number } {
  const limit = getLimit(pathname)
  const key = `${ip}:${pathname}`
  const now = Date.now()

  if (store.size > 10000) cleanup()

  let entry = store.get(key)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + WINDOW_MS }
    store.set(key, entry)
    return { allowed: true, retryAfterSeconds: 0 }
  }

  entry.count += 1
  if (entry.count <= limit) {
    return { allowed: true, retryAfterSeconds: 0 }
  }

  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
  return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) }
}
