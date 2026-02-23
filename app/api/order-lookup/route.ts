import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { sendDeliveryEmail } from '@/lib/email/delivery'
import { checkJsonBodySize } from '@/lib/api-limits'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-utils'

const GENERIC_MESSAGE =
  "If that order exists, we've sent a new download link to the email you provided."

/**
 * POST /api/order-lookup – Resend download link by order number + email.
 * Always returns 200 with generic message (no information leak).
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit(ip, request.nextUrl.pathname)
  if (!rateLimitResult.allowed) {
    // Return generic response to avoid information disclosure
    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
    })
  }
  const sizeError = checkJsonBodySize(request)
  if (sizeError) return sizeError
  let body: { orderNumber?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  }

  const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!orderNumber || !email) {
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  }

  const supabase = createClient()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_email, status')
    .eq('order_number', orderNumber.toUpperCase())
    .limit(1)
    .maybeSingle()

  if (error || !order) {
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  }

  const orderEmail = (order.customer_email || '').trim().toLowerCase()
  if (orderEmail !== email) {
    return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
  }

  const authUser = await getOptionalUser()
  if (authUser?.email && authUser.email.trim().toLowerCase() === email) {
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ user_id: authUser.id })
      .eq('id', order.id)
      .is('user_id', null)
    if (updateErr) {
      console.error('order-lookup: failed to link order to account', order.id, updateErr)
    }
  }

  if (order.status === 'delivered') {
    try {
      await sendDeliveryEmail(order.id)
    } catch (e) {
      console.error('order-lookup: sendDeliveryEmail failed', order.id, e)
    }
  }

  return NextResponse.json({ success: true, message: GENERIC_MESSAGE })
}
