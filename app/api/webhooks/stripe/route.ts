import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { generateAndStoreBundle } from '@/lib/bundle/createBundle'
import { sendDeliveryEmail } from '@/lib/email/delivery'

/**
 * POST /api/webhooks/stripe – Stripe webhook handler.
 * On checkout.session.completed: update order (payment_status, status, session id),
 * then trigger bundle generation (Task 16). See docs/STRIPE_SETUP.md for webhook URL and secret.
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 503 }
    )
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await request.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid signature'
    console.error('Stripe webhook signature verification failed:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const orderId = session.metadata?.order_id
  const generationId = session.metadata?.generation_id

  if (!orderId) {
    console.error('Webhook: checkout.session.completed missing metadata.order_id')
    return NextResponse.json({ received: true })
  }

  const supabase = createClient()

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      status: 'paid',
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) {
    console.error('Webhook: failed to update order', orderId, updateError)
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    )
  }

  if (generationId) {
    await supabase
      .from('generations')
      .update({
        is_purchased: true,
        purchased_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', generationId)
  }

  if (generationId) {
    const result = await generateAndStoreBundle(orderId, generationId)
    if (!result.delivered) {
      console.error('Webhook: bundle generation failed', orderId, result.error)
      return NextResponse.json(
        { error: result.error ?? 'Bundle generation failed' },
        { status: 500 }
      )
    }
    try {
      await sendDeliveryEmail(orderId)
    } catch (e) {
      console.error('Webhook: sendDeliveryEmail failed', orderId, e)
    }
  }

  return NextResponse.json({ received: true })
}
