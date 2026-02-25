import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { generateAndStoreBundle } from '@/lib/bundle/createBundle'
import { sendDeliveryEmail } from '@/lib/email/delivery'
import { serverErrorResponse } from '@/lib/api-error'
import { createPackPurchase } from '@/lib/pack-credits'
import { processPrintfulFulfillment } from '@/lib/fulfillment/process-printful-order'

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
  const productType = session.metadata?.product_type as string | undefined

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

  // Digital Pack: create pack purchase to grant credits
  if (productType?.startsWith('digital_pack_')) {
    const packType = productType.replace('digital_pack_', '') as 'starter' | 'creator' | 'artist'
    if (packType === 'starter' || packType === 'creator' || packType === 'artist') {
      const { data: order } = await supabase.from('orders').select('user_id').eq('id', orderId).single()
      if (order?.user_id) {
        await createPackPurchase(supabase, orderId, order.user_id, packType)
      }
    }
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

  // Bundle only for Get your Portrait (generationId + no print / digital_bundle legacy)
  if (generationId && productType !== 'art_print') {
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

  // Art Print: send to Printful fulfillment
  if (productType === 'art_print') {
    const printFromMeta = session.metadata?.print as string | undefined

    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, customer_email')
      .eq('id', orderId)
      .single()

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id, product_type, generation_id, print_dimensions')
      .eq('order_id', orderId)

    if (order && orderItems?.length) {
      if (printFromMeta) {
        const itemsWithoutPrint = orderItems.filter((i) => i.product_type === 'art_print' && !i.print_dimensions)
        for (const item of itemsWithoutPrint) {
          await supabase
            .from('order_items')
            .update({ print_dimensions: printFromMeta })
            .eq('id', item.id)
        }
        orderItems.forEach((i) => {
          if (i.product_type === 'art_print' && !i.print_dimensions) i.print_dimensions = printFromMeta
        })
      }

      const shippingDetails = session.shipping_details ?? session.shipping_address

      const result = await processPrintfulFulfillment(
        supabase,
        order,
        orderItems,
        shippingDetails as Parameters<typeof processPrintfulFulfillment>[3],
        stripeEmail ?? null
      )
      if (!result.success) {
        console.error('Printful fulfillment failed for order', orderId, result.error)
      }
    }
  }

  return NextResponse.json({ received: true })
}
