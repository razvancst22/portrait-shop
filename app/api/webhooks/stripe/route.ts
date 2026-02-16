import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { generateAndStoreBundle } from '@/lib/bundle/createBundle'
import { sendDeliveryEmail } from '@/lib/email/delivery'
import { serverErrorResponse } from '@/lib/api-error'

const PENDING_EMAIL_PLACEHOLDER = 'pending@stripe'

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

  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, customer_email, stripe_webhook_event_id')
    .eq('id', orderId)
    .maybeSingle()

  if (existingOrder?.stripe_webhook_event_id === event.id) {
    return NextResponse.json({ received: true })
  }

  const stripeEmail =
    (session.customer_details?.email as string | undefined) ??
    (session.customer_email as string | undefined)
  const shouldUpdateEmail =
    existingOrder?.customer_email === PENDING_EMAIL_PLACEHOLDER &&
    stripeEmail &&
    stripeEmail.length > 0

  const updatePayload: Record<string, unknown> = {
    payment_status: 'paid',
    status: 'paid',
    stripe_checkout_session_id: session.id,
    stripe_webhook_event_id: event.id,
    updated_at: new Date().toISOString(),
  }
  if (shouldUpdateEmail) {
    updatePayload.customer_email = stripeEmail
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)

  if (updateError) {
    return serverErrorResponse(updateError, `Webhook: update order ${orderId}`)
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
      return serverErrorResponse(
        result.error ?? new Error('Bundle generation failed'),
        `Webhook: bundle order ${orderId}`
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
