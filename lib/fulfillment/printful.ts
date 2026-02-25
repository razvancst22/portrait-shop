/**
 * Printful API client for physical art print fulfillment.
 * Docs: https://developers.printful.com/docs/
 */

const PRINTFUL_API_BASE = 'https://api.printful.com'

function getApiToken(): string {
  const token = process.env.PRINTFUL_API_TOKEN
  if (!token) {
    throw new Error('PRINTFUL_API_TOKEN is not configured')
  }
  return token
}

/**
 * Map our print dimensions to Printful Catalog variant IDs.
 * Verify via: GET /products?category_id=56 (Framed Posters) → GET /products/{id} for variant IDs.
 * See docs/PRINTFUL_SETUP.md for lookup instructions.
 */
export const PRINT_TO_PRINTFUL_VARIANT_ID: Record<string, number> = {
  '8×10"': 10760, // Premium Luster Framed Poster 8×10 (verify via Catalog API)
  '12×16"': 0, // TODO: fetch via GET /products?category_id=56
  '18×24"': 0, // TODO: fetch via GET /products?category_id=56
  '24×36"': 0, // TODO: fetch via GET /products?category_id=56
}

export type PrintfulRecipient = {
  name: string
  address1: string
  address2?: string
  city: string
  state_code?: string
  country_code: string
  zip: string
  phone?: string
  email?: string
}

export type PrintfulOrderItem = {
  variant_id: number
  quantity: number
  files: Array<{ type?: string; url: string }>
  external_id?: string
}

export type PrintfulCreateOrderPayload = {
  external_id?: string
  shipping?: string
  recipient: PrintfulRecipient
  items: PrintfulOrderItem[]
}

export type PrintfulCreateOrderResponse = {
  code: number
  result?: {
    id: number
    external_id?: string
    status: string
    [key: string]: unknown
  }
  error?: { reason?: string; message?: string }
}

async function printfulFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getApiToken()
  const url = `${PRINTFUL_API_BASE}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = (await res.json().catch(() => ({}))) as T & {
    error?: { reason?: string; message?: string }
    result?: string
  }

  if (!res.ok) {
    const errMsg =
      data?.error?.message ?? data?.result ?? res.statusText
    throw new Error(`Printful API error (${res.status}): ${errMsg}`)
  }

  return data
}

/**
 * Create an order in Printful for physical print fulfillment.
 * Use ?confirm=1 to auto-submit for fulfillment (skip draft).
 */
export async function createPrintfulOrder(
  payload: PrintfulCreateOrderPayload,
  options?: { confirm?: boolean }
): Promise<PrintfulCreateOrderResponse> {
  const query = options?.confirm ? '?confirm=1' : ''
  return printfulFetch<PrintfulCreateOrderResponse>(`/orders${query}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Map Stripe shipping address to Printful recipient format.
 * Stripe: address.line1, city, state, postal_code, country
 * Printful: address1, city, state_code, zip, country_code
 * state_code is required for US, AU, CA.
 */
export function mapStripeAddressToPrintfulRecipient(
  shippingDetails: {
    name?: string
    address?: {
      line1?: string
      line2?: string | null
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  },
  email?: string | null
): PrintfulRecipient {
  const addr = shippingDetails?.address
  if (!addr?.line1 || !addr?.city || !addr?.postal_code || !addr?.country) {
    throw new Error('Incomplete shipping address from Stripe')
  }

  const countryCode = addr.country
  const needsState = ['US', 'AU', 'CA'].includes(countryCode)
  if (needsState && !addr.state) {
    throw new Error(
      `State/province required for ${countryCode} but missing from Stripe address`
    )
  }

  return {
    name: shippingDetails?.name ?? 'Customer',
    address1: addr.line1,
    address2: addr.line2 ?? undefined,
    city: addr.city,
    state_code: addr.state ?? undefined,
    country_code: countryCode,
    zip: addr.postal_code,
    email: email ?? undefined,
  }
}
