/**
 * URL validation to prevent SSRF attacks.
 * Only allows URLs from trusted domains (Supabase storage).
 */

/**
 * Validates that a URL is safe to fetch from the server.
 * Blocks:
 * - Non-HTTPS URLs
 * - Private/internal IP addresses
 * - URLs not from allowed domains
 */
export function validateUrlForFetch(url: string, allowedDomains: string[]): { valid: boolean; error?: string } {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(url)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  // Only allow HTTPS
  if (parsedUrl.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS URLs are allowed' }
  }

  // Check if domain is in allowed list
  const hostname = parsedUrl.hostname.toLowerCase()
  const isAllowed = allowedDomains.some((domain) => {
    const normalizedDomain = domain.toLowerCase()
    // Allow exact match or subdomain match
    return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`)
  })

  if (!isAllowed) {
    return { valid: false, error: `URL domain not in allowed list: ${hostname}` }
  }

  // Block private/internal IP ranges (defense in depth, in case DNS resolves to internal IP)
  if (isPrivateOrReservedIP(hostname)) {
    return { valid: false, error: 'Private or reserved IP addresses are not allowed' }
  }

  return { valid: true }
}

/**
 * Check if hostname is a private, reserved, or internal IP address.
 * This catches attempts to use IP addresses directly instead of domain names.
 */
function isPrivateOrReservedIP(hostname: string): boolean {
  // Block localhost variations
  if (hostname === 'localhost' || hostname === 'local' || hostname.endsWith('.local')) {
    return true
  }

  // Check for IP address patterns
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const match = hostname.match(ipv4Regex)

  if (match) {
    const octets = [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10), parseInt(match[4], 10)]

    // 127.x.x.x - Loopback
    if (octets[0] === 127) return true

    // 10.x.x.x - Private Class A
    if (octets[0] === 10) return true

    // 172.16.x.x - 172.31.x.x - Private Class B
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true

    // 192.168.x.x - Private Class C
    if (octets[0] === 192 && octets[1] === 168) return true

    // 169.254.x.x - Link-local
    if (octets[0] === 169 && octets[1] === 254) return true

    // 0.0.0.0/8 - "This network"
    if (octets[0] === 0) return true

    // 224.0.0.0/4 - Multicast
    if (octets[0] >= 224 && octets[0] <= 239) return true

    // 240.0.0.0/4 - Reserved for future use
    if (octets[0] >= 240) return true
  }

  // Block IPv6 loopback and private addresses
  if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80')) {
    return true
  }

  // Block IPv6 loopback bracket notation
  if (hostname === '[::1]') return true

  return false
}

/**
 * Gets allowed domains for image fetching from environment.
 * Falls back to extracting domain from NEXT_PUBLIC_SUPABASE_URL.
 */
export function getAllowedImageDomains(): string[] {
  const domains: string[] = []

  // Add Supabase domain
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl)
      domains.push(parsed.hostname)
    } catch {
      // Invalid URL, skip
    }
  }

  // Allow additional domains via env var (comma-separated)
  const additionalDomains = process.env.ALLOWED_IMAGE_DOMAINS
  if (additionalDomains) {
    domains.push(...additionalDomains.split(',').map((d) => d.trim()).filter(Boolean))
  }

  return domains
}