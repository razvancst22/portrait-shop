import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { checkJsonBodySize } from '@/lib/api-limits'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'
import { serverErrorResponse } from '@/lib/api-error'
import { checkoutBodySchema, validationErrorResponse } from '@/lib/api-schemas'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-utils'
import {
  GET_YOUR_PORTRAIT_PRICE_USD,
  GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD,
  GET_YOUR_PORTRAIT_DISCOUNT_COUNTDOWN_MS,
  DIGITAL_PACKS,
  ART_PRINT_OPTIONS,
} from '@/lib/pricing/constants'
import { createPackPurchase } from '@/lib/pack-credits'

function generateOrderNumber(): string {
  const t = Date.now().toString(36).slice(-6)
  const r = Math.random().toString(36).slice(2, 6)
  return `ORD-${t}-${r}`.toUpperCase()
}

const PENDING_EMAIL_PLACEHOLDER = 'pending@stripe'

/**
 * POST /api/checkout – create order and Stripe Checkout session.
 * Supports: Get your Portrait (generationId), Art Print Pack (generationId+print), Digital Packs (pack).
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit(ip, request.nextUrl.pathname)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many checkout attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': rateLimitResult.retryAfterSeconds.toString() },
      }
    )
  }

  const sizeError = checkJsonBodySize(request)
  if (sizeError) return sizeError
  try {
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, { status: 400 })
    }
    const parsed = checkoutBodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(validationErrorResponse(parsed.error), { status: 400 })
    }
    const { generationId, email, useDiscount, pack, print } = parsed.data

    const user = await getOptionalUser()
    const supabase = createClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin

    // --- Digital Pack flow (requires sign-in) ---
    if (pack && (pack === 'starter' || pack === 'creator' || pack === 'artist')) {
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Please sign in to purchase a Digital Pack.', code: 'SIGN_IN_REQUIRED' },
          { status: 401 }
        )
      }
      const packConfig = DIGITAL_PACKS[pack]
      const total = packConfig.priceUsd

      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        const bypassAllowed =
          process.env.NODE_ENV === 'development' || process.env.BYPASS_STRIPE_FOR_TESTING === 'true'
        if (bypassAllowed) {
          const orderNumber = generateOrderNumber()
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              order_number: orderNumber,
              customer_email: email || user?.email || 'test@localhost',
              subtotal_usd: total,
              tax_amount_usd: 0,
              total_usd: total,
              payment_status: 'paid',
              status: 'paid',
              ...(user?.id && { user_id: user.id }),
            })
            .select('id')
            .single()
          if (orderError || !order)
            return serverErrorResponse(orderError ?? new Error('No order returned'), 'Order insert (bypass)')
          await supabase.from('order_items').insert({
            order_id: order.id,
            product_type: `digital_pack_${pack}`,
            unit_price_usd: total,
            quantity: 1,
            subtotal_usd: total,
          })
          if (user?.id) {
            await createPackPurchase(supabase, order.id, user.id, pack)
          }
          return NextResponse.json({
            bypass: true,
            orderId: order.id,
            orderNumber,
            message: 'Digital pack purchased. Credits granted.',
          })
        }
        return NextResponse.json(
          { error: 'Stripe is not configured', code: 'STRIPE_NOT_CONFIGURED', doc: 'See docs/STRIPE_SETUP.md' },
          { status: 503 }
        )
      }

      const orderNumber = generateOrderNumber()
      const useStripeEmail = !email || email.length === 0
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_email: useStripeEmail ? PENDING_EMAIL_PLACEHOLDER : email!,
          subtotal_usd: total,
          tax_amount_usd: 0,
          total_usd: total,
          payment_status: 'pending',
          status: 'pending_payment',
          ...(user?.id && { user_id: user.id }),
        })
        .select('id')
        .single()
      if (orderError || !order)
        return serverErrorResponse(orderError ?? new Error('No order returned'), 'Order insert')
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_type: `digital_pack_${pack}`,
        unit_price_usd: total,
        quantity: 1,
        subtotal_usd: total,
      })
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        ...(useStripeEmail ? {} : { customer_email: email! }),
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: packConfig.description,
              description: `${packConfig.generations} portrait generations, ${packConfig.highResDownloads} high-res download${packConfig.pricePerArtwork ? `, $${packConfig.pricePerArtwork} per artwork` : ''}`,
            },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        }],
        success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        metadata: { order_id: order.id, product_type: `digital_pack_${pack}` },
      })
      return NextResponse.json({ checkoutUrl: session.url, orderId: order.id, orderNumber })
    }

    // --- Get your Portrait or Art Print Pack (requires generationId) ---
    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generationId. Provide generationId for Get your Portrait or Art Print Pack.' },
        { status: 400 }
      )
    }

    const { data: gen, error: genError } = await supabase
      .from('generations')
      .select('id, status, session_id, completed_at')
      .eq('id', generationId)
      .single()

    if (genError || !gen) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }
    if (gen.status !== 'completed') {
      return NextResponse.json({ error: 'Generation is not ready for purchase' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
    const isOwner = gen.session_id && (user?.id === gen.session_id || guestId === gen.session_id)
    if (gen.session_id && !isOwner) {
      return NextResponse.json(
        { error: 'You can only purchase portraits you created.', code: 'OWNERSHIP_MISMATCH' },
        { status: 403 }
      )
    }

    let total: number
    let productType: string
    let productName: string
    let productDescription: string

    if (print) {
      // Art Print Pack
      const opt = ART_PRINT_OPTIONS.find((o) => o.dimensions === print)
      if (!opt) {
        return NextResponse.json({ error: 'Invalid print size' }, { status: 400 })
      }
      total = opt.price
      productType = 'art_print'
      productName = `Art Print Pack – ${opt.dimensions}`
      productDescription = 'Museum quality print, last over 100 years, free shipping worldwide'
    } else {
      // Get your Portrait
      const discountValid =
        useDiscount &&
        gen.completed_at &&
        Date.now() - new Date(gen.completed_at).getTime() < GET_YOUR_PORTRAIT_DISCOUNT_COUNTDOWN_MS
      total = discountValid ? GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD : GET_YOUR_PORTRAIT_PRICE_USD
      productType = 'get_your_portrait'
      productName = 'Get your Portrait'
      productDescription = 'Upgrade to 4K, no watermark'
    }

    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      const bypassAllowed =
        process.env.NODE_ENV === 'development' || process.env.BYPASS_STRIPE_FOR_TESTING === 'true'
      if (bypassAllowed && productType === 'get_your_portrait') {
        const { generateAndStoreBundle } = await import('@/lib/bundle/createBundle')
        const { createDownloadToken } = await import('@/lib/email/delivery')
        const orderNumber = generateOrderNumber()
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_email: email || user?.email || 'test@localhost',
            subtotal_usd: total,
            tax_amount_usd: 0,
            total_usd: total,
            payment_status: 'paid',
            status: 'paid',
            ...(user?.id && { user_id: user.id }),
          })
          .select('id')
          .single()
        if (orderError || !order)
          return serverErrorResponse(orderError ?? new Error('No order returned'), 'Order insert (bypass)')
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_type: productType,
          generation_id: generationId,
          unit_price_usd: total,
          quantity: 1,
          subtotal_usd: total,
        })
        await supabase
          .from('generations')
          .update({
            is_purchased: true,
            purchased_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', generationId)
        const result = await generateAndStoreBundle(order.id, generationId)
        if (!result.delivered)
          return NextResponse.json({ error: result.error || 'Bundle generation failed' }, { status: 500 })
        const downloadToken = createDownloadToken(order.id)
        const downloadUrl = `${baseUrl}/download?token=${encodeURIComponent(downloadToken)}`
        return NextResponse.json({ bypass: true, downloadUrl, orderId: order.id, orderNumber })
      }
      if (bypassAllowed && productType === 'art_print') {
        const orderNumber = generateOrderNumber()
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_email: email || user?.email || 'test@localhost',
            subtotal_usd: total,
            tax_amount_usd: 0,
            total_usd: total,
            payment_status: 'paid',
            status: 'paid',
            ...(user?.id && { user_id: user.id }),
          })
          .select('id')
          .single()
        if (orderError || !order)
          return serverErrorResponse(orderError ?? new Error('No order returned'), 'Order insert (bypass)')
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_type: productType,
          generation_id: generationId,
          unit_price_usd: total,
          quantity: 1,
          subtotal_usd: total,
        })
        return NextResponse.json({
          bypass: true,
          orderId: order.id,
          orderNumber,
          message: 'Art print order (bypass). Fulfillment via Artelo in Phase 4.',
        })
      }
      return NextResponse.json(
        { error: 'Stripe is not configured', code: 'STRIPE_NOT_CONFIGURED', doc: 'See docs/STRIPE_SETUP.md' },
        { status: 503 }
      )
    }

    const orderNumber = generateOrderNumber()
    const useStripeEmail = !email || email.length === 0
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: useStripeEmail ? PENDING_EMAIL_PLACEHOLDER : email!,
        subtotal_usd: total,
        tax_amount_usd: 0,
        total_usd: total,
        payment_status: 'pending',
        status: 'pending_payment',
        ...(user?.id && { user_id: user.id }),
      })
      .select('id')
      .single()
    if (orderError || !order)
      return serverErrorResponse(orderError ?? new Error('No order returned'), 'Order insert')
    await supabase.from('order_items').insert({
      order_id: order.id,
      product_type: productType,
      generation_id: generationId,
      unit_price_usd: total,
      quantity: 1,
      subtotal_usd: total,
      ...(productType === 'art_print' && print && { print_dimensions: print }),
    })
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      ...(useStripeEmail ? {} : { customer_email: email! }),
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productName, description: productDescription },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/preview/${generationId}`,
      metadata: {
        order_id: order.id,
        generation_id: generationId,
        product_type: productType,
        ...(productType === 'art_print' && print && { print }),
      },
    }
    if (productType === 'art_print') {
      sessionConfig.shipping_address_collection = {
        allowed_countries: [
          'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE',
          'PT', 'PL', 'SE', 'DK', 'NO', 'FI', 'CH', 'NZ', 'JP', 'SG', 'HK',
        ],
      }
    }
    const session = await stripe.checkout.sessions.create(sessionConfig)
    return NextResponse.json({ checkoutUrl: session.url, orderId: order.id, orderNumber })
  } catch (e) {
    return serverErrorResponse(e, 'Checkout')
  }
}
