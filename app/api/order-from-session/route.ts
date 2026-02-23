import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

/**
 * GET /api/order-from-session?session_id=... – get order ID from Stripe checkout session.
 * Used by order success page to link to order detail.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
    return NextResponse.json({ orderId: null })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const orderId = session.metadata?.order_id
    if (!orderId) {
      return NextResponse.json({ orderId: null })
    }
    return NextResponse.json({ orderId })
  } catch {
    return NextResponse.json({ orderId: null })
  }
}
