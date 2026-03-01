import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { sendBrevoEmail } from '@/lib/email/brevo'
import {
  deliveryReadyContent,
  orderConfirmationContent,
  shippedContent,
} from '@/lib/email/templates'

const TOKEN_EXPIRY_DAYS = 7

function getDownloadTokenSecret(): string {
  const secret = process.env.DOWNLOAD_TOKEN_SECRET || process.env.BREVO_API_KEY || process.env.RESEND_API_KEY
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

function extractFirstName(email: string, customerName?: string | null): string {
  if (customerName?.trim()) {
    const first = customerName.trim().split(/\s+/)[0]
    if (first) return first
  }
  const local = (email.split('@')[0] ?? '').trim()
  if (!local) return ''
  const part = local.includes('.') ? local.split('.')[0] ?? local : local
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
}

/**
 * Send delivery email with download link. Uses Brevo. If BREVO_API_KEY not set, skips (no throw).
 */
export async function sendDeliveryEmail(orderId: string): Promise<void> {
  const supabase = createClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_number, customer_email, customer_name')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('sendDeliveryEmail: order not found', orderId, orderError)
    return
  }

  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not set; skipping delivery email for order', order.order_number)
    return
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const token = createDownloadToken(orderId)
  const downloadUrl = `${baseUrl}/download?token=${encodeURIComponent(token)}`

  try {
    const html = deliveryReadyContent({
      firstName: extractFirstName(order.customer_email, order.customer_name),
      orderNumber: order.order_number,
      downloadUrl,
      expiryDays: TOKEN_EXPIRY_DAYS,
    })
    await sendBrevoEmail({
      to: order.customer_email,
      subject: `Your portrait is ready – Order ${order.order_number}`,
      htmlContent: html,
      tags: ['order', 'delivery'],
    })
  } catch (e) {
    console.error('sendDeliveryEmail: failed', orderId, e)
  }
}

/**
 * Send order confirmation email (payment received). Option A: keep Stripe receipt + add this branded email.
 */
export async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  const supabase = createClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_number, customer_email, customer_name, total_usd')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('sendOrderConfirmationEmail: order not found', orderId, orderError)
    return
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('product_type, quantity, unit_price_usd')
    .eq('order_id', orderId)

  const PRODUCT_LABELS: Record<string, string> = {
    get_your_portrait: 'Get your Portrait',
    art_print: 'Art Print Pack',
    digital_pack_starter: 'Starter Pack',
    digital_pack_creator: 'Creator Pack',
    digital_pack_artist: 'Artist Pack',
  }
  const itemsSummary =
    (items ?? [])
      .map(
        (i) =>
          `${PRODUCT_LABELS[i.product_type] ?? i.product_type.replace(/_/g, ' ')} × ${i.quantity} — $${Number(i.unit_price_usd).toFixed(2)}`
      )
      .join('<br/>') || 'Digital portrait'

  const hasPhysical = (items ?? []).some((i) => i.product_type === 'art_print')

  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not set; skipping order confirmation for', order.order_number)
    return
  }

  try {
    const html = orderConfirmationContent({
      firstName: extractFirstName(order.customer_email, order.customer_name),
      orderNumber: order.order_number,
      totalUsd: Number(order.total_usd).toFixed(2),
      isPhysical: hasPhysical,
      itemsSummary,
    })
    await sendBrevoEmail({
      to: order.customer_email,
      subject: `Order confirmed – ${order.order_number}`,
      htmlContent: html,
      tags: ['order', 'confirmation'],
    })
  } catch (e) {
    console.error('sendOrderConfirmationEmail: failed', orderId, e)
  }
}

/**
 * Send shipped email (physical order – tracking). Called from Printful webhook.
 */
export async function sendShippedEmail(
  orderId: string,
  trackingUrl: string | null,
  trackingNumber: string | null
): Promise<void> {
  const supabase = createClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('order_number, customer_email, customer_name')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('sendShippedEmail: order not found', orderId, orderError)
    return
  }

  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not set; skipping shipped email for', order.order_number)
    return
  }

  try {
    const html = shippedContent({
      firstName: extractFirstName(order.customer_email, order.customer_name),
      orderNumber: order.order_number,
      trackingUrl,
      trackingNumber,
    })
    await sendBrevoEmail({
      to: order.customer_email,
      subject: `Your order has shipped – ${order.order_number}`,
      htmlContent: html,
      tags: ['order', 'shipped'],
    })
  } catch (e) {
    console.error('sendShippedEmail: failed', orderId, e)
  }
}
