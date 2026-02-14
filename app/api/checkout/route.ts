import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { DIGITAL_BUNDLE_PRICE_USD } from '@/lib/constants'
import { checkJsonBodySize } from '@/lib/api-limits'

function generateOrderNumber(): string {
  const t = Date.now().toString(36).slice(-6)
  const r = Math.random().toString(36).slice(2, 6)
  return `ORD-${t}-${r}`.toUpperCase()
}

/**
 * POST /api/checkout – create order and Stripe Checkout session (fixed $10).
 * Body: { generationId, email }
 * Returns: { checkoutUrl } or error if Stripe not configured.
 */
export async function POST(request: NextRequest) {
  const sizeError = checkJsonBodySize(request)
  if (sizeError) return sizeError
  try {
    const body = await request.json()
    const { generationId, email } = body as { generationId?: string; email?: string }

    if (!generationId || !email?.trim()) {
      return NextResponse.json(
        { error: 'Missing generationId or email' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: gen, error: genError } = await supabase
      .from('generations')
      .select('id, status')
      .eq('id', generationId)
      .single()

    if (genError || !gen) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }
    if (gen.status !== 'completed') {
      return NextResponse.json(
        { error: 'Generation is not ready for purchase' },
        { status: 400 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      return NextResponse.json(
        {
          error: 'Stripe is not configured',
          code: 'STRIPE_NOT_CONFIGURED',
          doc: 'See docs/STRIPE_SETUP.md to enable payments.',
        },
        { status: 503 }
      )
    }

    const orderNumber = generateOrderNumber()
    const total = DIGITAL_BUNDLE_PRICE_USD

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: email.trim(),
        subtotal_usd: total,
        tax_amount_usd: 0,
        total_usd: total,
        payment_status: 'pending',
        status: 'pending_payment',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return NextResponse.json(
        { error: orderError?.message ?? 'Failed to create order' },
        { status: 500 }
      )
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      product_type: 'digital_bundle',
      generation_id: generationId,
      unit_price_usd: DIGITAL_BUNDLE_PRICE_USD,
      quantity: 1,
      subtotal_usd: DIGITAL_BUNDLE_PRICE_USD,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email.trim(),
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Digital portrait bundle',
              description: 'High-res portrait + phone, iPad & desktop wallpapers',
            },
            unit_amount: Math.round(DIGITAL_BUNDLE_PRICE_USD * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/preview/${generationId}`,
      metadata: {
        order_id: order.id,
        generation_id: generationId,
      },
    })

    return NextResponse.json({
      checkoutUrl: session.url,
      orderId: order.id,
      orderNumber,
    })
  } catch (e) {
    console.error('Checkout error:', e)
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Checkout failed',
        ...(e instanceof Error && e.message.includes('Stripe')
          ? { doc: 'See docs/STRIPE_SETUP.md to configure Stripe.' }
          : {}),
      },
      { status: 500 }
    )
  }
}
