import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { stripe } from '@/lib/stripe'
import { DIGITAL_BUNDLE_PRICE_USD } from '@/lib/constants'
import { checkJsonBodySize } from '@/lib/api-limits'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'
import { serverErrorResponse } from '@/lib/api-error'
import { checkoutBodySchema, validationErrorResponse } from '@/lib/api-schemas'

function generateOrderNumber(): string {
  const t = Date.now().toString(36).slice(-6)
  const r = Math.random().toString(36).slice(2, 6)
  return `ORD-${t}-${r}`.toUpperCase()
}

const PENDING_EMAIL_PLACEHOLDER = 'pending@stripe'

/**
 * POST /api/checkout – create order and Stripe Checkout session (fixed $10).
 * Body: { generationId, email? }. If email omitted, Stripe Checkout collects it; we set it from the webhook.
 * Returns: { checkoutUrl } or error if Stripe not configured.
 */
export async function POST(request: NextRequest) {
  const sizeError = checkJsonBodySize(request)
  if (sizeError) return sizeError
  try {
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }
    const parsed = checkoutBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        validationErrorResponse(parsed.error),
        { status: 400 }
      )
    }
    const { generationId, email } = parsed.data

    const supabase = createClient()

    const { data: gen, error: genError } = await supabase
      .from('generations')
      .select('id, status, session_id')
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

    const user = await getOptionalUser()
    const cookieStore = await cookies()
    const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
    const isOwner = gen.session_id && (user?.id === gen.session_id || guestId === gen.session_id)
    if (gen.session_id && !isOwner) {
      return NextResponse.json(
        { error: 'You can only purchase portraits you created.', code: 'OWNERSHIP_MISMATCH' },
        { status: 403 }
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
    const useStripeEmail = !email || email.length === 0
    const orderEmail = useStripeEmail ? PENDING_EMAIL_PLACEHOLDER : email

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: orderEmail,
        subtotal_usd: total,
        tax_amount_usd: 0,
        total_usd: total,
        payment_status: 'pending',
        status: 'pending_payment',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return serverErrorResponse(orderError ?? new Error('No order returned'), 'Order insert')
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
      ...(useStripeEmail ? {} : { customer_email: email }),
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
    return serverErrorResponse(e, 'Checkout')
  }
}
