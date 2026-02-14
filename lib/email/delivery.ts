import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const TOKEN_EXPIRY_DAYS = 7

function getDownloadTokenSecret(): string {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || process.env.RESEND_API_KEY
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('DOWNLOAD_TOKEN_SECRET is required in production')
  }
  return secret || 'dev-secret-change-in-production'
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Buffer | null {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (str.length % 4)) % 4)
    return Buffer.from(padded, 'base64')
  } catch {
    return null
  }
}

/**
 * Create a signed download token for an order. Token payload: { orderId, exp }.
 * URL: {baseUrl}/download?token={token}
 */
export function createDownloadToken(orderId: string): string {
  const secret = getDownloadTokenSecret()
  const exp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_DAYS * 24 * 3600
  const payload = JSON.stringify({ orderId, exp })
  const payloadB64 = base64UrlEncode(Buffer.from(payload, 'utf8'))
  const sig = createHmac('sha256', secret).update(payloadB64).digest()
  const sigB64 = base64UrlEncode(sig)
  return `${sigB64}.${payloadB64}`
}

/**
 * Verify download token and return orderId if valid and not expired.
 */
export function verifyDownloadToken(token: string): { orderId: string } | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [sigB64, payloadB64] = parts
  const sig = base64UrlDecode(sigB64)
  const payloadBuf = base64UrlDecode(payloadB64)
  if (!sig || !payloadBuf) return null
  const secret = getDownloadTokenSecret()
  const expectedSig = createHmac('sha256', secret).update(payloadB64).digest()
  if (sig.length !== expectedSig.length || !timingSafeEqual(sig, expectedSig)) return null
  let payload: { orderId?: string; exp?: number }
  try {
    payload = JSON.parse(payloadBuf.toString('utf8'))
  } catch {
    return null
  }
  if (!payload.orderId || typeof payload.exp !== 'number') return null
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  return { orderId: payload.orderId }
}

/**
 * Send delivery email with order number and download link. If RESEND_API_KEY is not set, logs and resolves (no throw).
 */
export async function sendDeliveryEmail(orderId: string): Promise<void> {
  const supabase = createClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_number, customer_email')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('sendDeliveryEmail: order not found', orderId, orderError)
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const token = createDownloadToken(orderId)
  const downloadUrl = `${baseUrl}/download?token=${encodeURIComponent(token)}`

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set; skipping delivery email for order', order.order_number)
    return
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)
    const from = process.env.RESEND_FROM_EMAIL || 'Pet Portrait <onboarding@resend.dev>'
    const { error } = await resend.emails.send({
      from,
      to: order.customer_email,
      subject: `Your portrait is ready – Order ${order.order_number}`,
      html: `
        <p>Thank you for your order!</p>
        <p>Your digital portrait bundle is ready. Order number: <strong>${order.order_number}</strong>.</p>
        <p><a href="${downloadUrl}">Download your portrait bundle</a></p>
        <p>This link expires in ${TOKEN_EXPIRY_DAYS} days. If you need a new link, use our <a href="${baseUrl}/order-lookup">order lookup</a> page.</p>
        <p>— petportrait.shop</p>
      `,
    })
    if (error) {
      console.error('sendDeliveryEmail: Resend error', orderId, error)
    }
  } catch (e) {
    console.error('sendDeliveryEmail: failed', orderId, e)
  }
}
