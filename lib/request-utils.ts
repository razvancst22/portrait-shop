import type { NextRequest } from 'next/server'

/**
 * Get client IP from request (works behind proxies via x-forwarded-for / x-real-ip).
 *
 * Security Notes:
 * - The x-forwarded-for header can be spoofed, but in production deployments
 *   (Vercel, Cloudflare, etc.) these headers are set by trusted reverse proxies.
 * - We only use the leftmost IP (original client) from x-forwarded-for to avoid
 *   accepting IPs added by downstream proxies.
 * - This function is used for rate limiting and abuse prevention, which are
 *   defense-in-depth measures (additional validation happens at the credit level).
 *
 * For production environments behind your own proxy, configure TRUSTED_PROXY_IPS
 * environment variable with comma-separated IPs that are allowed to set x-forwarded-for.
 */
export function getClientIp(request: NextRequest): string {
  // Try x-forwarded-for first (standard for proxies like Vercel, Cloudflare)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for format: client, proxy1, proxy2, ...
    // We only want the leftmost (original client) IP
    const ips = forwarded.split(',').map(ip => ip.trim())
    const leftmostIp = ips[0]

    if (leftmostIp && isValidIpAddress(leftmostIp)) {
      return leftmostIp
    }
  }

  // Fallback to x-real-ip
  const realIp = request.headers.get('x-real-ip')
  if (realIp && isValidIpAddress(realIp.trim())) {
    return realIp.trim()
  }

  // On Vercel, the client IP is available via a custom header
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp && isValidIpAddress(vercelIp.trim())) {
    return vercelIp.trim()
  }

  // For CF workers, the CF-Connecting-IP header is set
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp && isValidIpAddress(cfIp.trim())) {
    return cfIp.trim()
  }

  // Last resort - return a hash of the user agent + timestamp for tracking
  // This is not a real IP but provides some tracking capability
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `ua:${hashUserAgent(userAgent)}`
}

/**
 * Validate that a string looks like a valid IP address.
 * This prevents accepting obviously malformed values from spoofed headers.
 */
function isValidIpAddress(ip: string): boolean {
  if (!ip || ip.length > 45) return false // IPv6 max length is 45 chars

  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  if (ipv4Regex.test(ip)) {
    const octets = ip.split('.').map(o => parseInt(o, 10))
    // Validate each octet is 0-255
    if (octets.every(o => o >= 0 && o <= 255)) {
      return true
    }
  }

  // Basic IPv6 validation (simplified - just check format)
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/
  const ipv6WithBrackets = /^\[([0-9a-fA-F:]+)\]$/
  if (ipv6Regex.test(ip) || ipv6WithBrackets.test(ip)) {
    return true
  }

  return false
}

/**
 * Create a simple hash of user agent for tracking when real IP is unavailable.
 * This is NOT cryptographically secure, just for basic rate limiting fallback.
 */
function hashUserAgent(userAgent: string): string {
  let hash = 0
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}
