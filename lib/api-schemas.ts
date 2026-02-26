import { z } from 'zod'
import { ART_STYLE_IDS, getPalettesForStyle, type ArtStyleId } from '@/lib/prompts/artStyles'

const SUBJECT_TYPE_IDS = ['pet', 'dog', 'cat', 'family', 'children', 'couple', 'self'] as const
const PET_TYPE_IDS = ['dog', 'cat'] as const

/**
 * Validates that a URL is safe and from allowed domains to prevent SSRF attacks.
 */
function validateImageUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url)

    // Only allow HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed for imageUrl' }
    }

    // Block private/internal IP ranges
    const hostname = parsedUrl.hostname.toLowerCase()

    // Block localhost variations
    if (hostname === 'localhost' || hostname === 'local' || hostname.endsWith('.local')) {
      return { valid: false, error: 'Private URLs are not allowed for imageUrl' }
    }

    // Check for IP address patterns and block private ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const match = hostname.match(ipv4Regex)

    if (match) {
      const octets = [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10), parseInt(match[4], 10)]

      // 127.x.x.x - Loopback
      if (octets[0] === 127) return { valid: false, error: 'Private URLs are not allowed for imageUrl' }

      // 10.x.x.x - Private Class A
      if (octets[0] === 10) return { valid: false, error: 'Private URLs are not allowed for imageUrl' }

      // 172.16.x.x - 172.31.x.x - Private Class B
      if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
        return { valid: false, error: 'Private URLs are not allowed for imageUrl' }
      }

      // 192.168.x.x - Private Class C
      if (octets[0] === 192 && octets[1] === 168) return { valid: false, error: 'Private URLs are not allowed for imageUrl' }

      // 169.254.x.x - Link-local
      if (octets[0] === 169 && octets[1] === 254) return { valid: false, error: 'Private URLs are not allowed for imageUrl' }
    }

    // Block IPv6 loopback and private addresses
    if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80')) {
      return { valid: false, error: 'Private URLs are not allowed for imageUrl' }
    }

    // Get allowed domains from environment
    const allowedDomains: string[] = []
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      try {
        const parsed = new URL(supabaseUrl)
        allowedDomains.push(parsed.hostname)
      } catch {
        // Invalid URL, skip
      }
    }

    const additionalDomains = process.env.ALLOWED_IMAGE_DOMAINS
    if (additionalDomains) {
      allowedDomains.push(...additionalDomains.split(',').map((d) => d.trim()).filter(Boolean))
    }

    // If no domains configured, allow the check to pass (defense in depth later in fetch)
    if (allowedDomains.length === 0) {
      return { valid: true }
    }

    // Check if domain is in allowed list
    const isAllowed = allowedDomains.some((domain) => {
      const normalizedDomain = domain.toLowerCase()
      // Allow exact match or subdomain match
      return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`)
    })

    if (!isAllowed) {
      return { valid: false, error: `imageUrl domain not in allowed list. Allowed: ${allowedDomains.join(', ')}` }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format for imageUrl' }
  }
}

const imageUrlSchema = z.string().min(1).refine(
  (url) => validateImageUrl(url).valid,
  'Invalid URL. Must be valid HTTPS from allowed domains.'
)

export const generateBodySchema = z
  .object({
    imageUrl: imageUrlSchema.optional(),
    imageUrls: z.array(imageUrlSchema).min(2).max(6).optional(),
    idempotencyKey: z.string().min(1).max(255).optional(),
    artStyle: z.enum(ART_STYLE_IDS as [string, ...string[]], {
      message: `Invalid artStyle. Allowed: ${ART_STYLE_IDS.join(', ')}`,
    }),
    subjectType: z.enum(SUBJECT_TYPE_IDS).optional().default('pet'),
    petType: z.enum(PET_TYPE_IDS).optional(),
    /** Optional color palette variant (e.g. renaissance_classic, renaissance_royal). Same fixed elements, different colors. */
    colorPalette: z.string().min(1).optional(),
  })
  .refine(
    (data) => {
      const subject = data.subjectType ?? 'pet'
      const singleImageTypes = ['pet', 'dog', 'cat', 'self', 'children']
      if (singleImageTypes.includes(subject)) {
        return !!(data.imageUrl && data.imageUrl.length > 0)
      }
      return (
        (data.imageUrl && data.imageUrl.length > 0) ||
        (data.imageUrls && data.imageUrls.length > 0)
      )
    },
    {
      message: 'Provide imageUrl for single-photo. For family/couple, provide imageUrls (2-6).',
      path: ['imageUrl'],
    }
  )
  .refine(
    (data) => {
      const urls = data.imageUrls
      if (!urls || urls.length === 0) return true
      const subject = data.subjectType ?? 'pet'
      if (subject === 'couple') return urls.length === 2
      if (subject === 'family') return urls.length >= 2 && urls.length <= 6
      return true
    },
    { message: 'Couple requires 2 photos. Family requires 2-6 photos.', path: ['imageUrls'] }
  )
  .refine(
    (data) => {
      if (!data.colorPalette) return true
      const palettes = getPalettesForStyle(data.artStyle as ArtStyleId)
      return palettes.includes(data.colorPalette)
    },
    {
      message: 'colorPalette must be a valid palette for the selected art style. Check /api/styles for colorPalettes per style.',
      path: ['colorPalette'],
    }
  )

export type GenerateBody = z.infer<typeof generateBodySchema>

export const checkoutBodySchema = z.object({
  generationId: z.string().uuid('Invalid generationId').optional(),
  /** Optional: if omitted, Stripe Checkout collects email; we set it from the webhook. */
  email: z.string().trim().email('Invalid email address').optional().default(''),
  /** Apply 1-hour discount for Get your Portrait (validated server-side) */
  useDiscount: z.boolean().optional().default(false),
  /** Digital Pack: starter | creator | artist */
  pack: z.enum(['starter', 'creator', 'artist']).optional(),
  /** Art Print Pack: print size e.g. "8×10\"" */
  print: z.string().min(1).optional(),
})

export type CheckoutBody = z.infer<typeof checkoutBodySchema>

/** Consistent 400 shape for validation failures */
export function validationErrorResponse(
  error: z.ZodError,
  message = 'Validation failed'
): { error: string; code: string; details?: z.ZodIssue[] } {
  const first = error.issues[0]
  return {
    error: first?.message ?? message,
    code: 'VALIDATION_ERROR',
    details: error.issues.length > 1 ? error.issues : undefined,
  }
}
