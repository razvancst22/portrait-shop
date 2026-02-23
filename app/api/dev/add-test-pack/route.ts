import { NextRequest, NextResponse } from 'next/server'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { createPackPurchase } from '@/lib/pack-credits'
import { DIGITAL_PACKS } from '@/lib/pricing/constants'
import type { DigitalPackId } from '@/lib/pricing/constants'

function generateOrderNumber(): string {
  const t = Date.now().toString(36).slice(-6)
  const r = Math.random().toString(36).slice(2, 6)
  return `DEV-${t}-${r}`.toUpperCase()
}

/**
 * POST /api/dev/add-test-pack – add a test Digital Pack for the logged-in user.
 * Only works when NODE_ENV=development. Use to test pack credits without Stripe.
 * Body: { pack: 'starter' | 'creator' | 'artist' }
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const user = await getOptionalUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  let body: { pack?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pack = body.pack as DigitalPackId | undefined
  if (!pack || !(pack === 'starter' || pack === 'creator' || pack === 'artist')) {
    return NextResponse.json(
      { error: 'Invalid pack. Use starter, creator, or artist.' },
      { status: 400 }
    )
  }

  const supabase = createClientIfConfigured()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 503 }
    )
  }

  const config = DIGITAL_PACKS[pack]
  if (!config) {
    return NextResponse.json({ error: 'Unknown pack' }, { status: 400 })
  }

  try {
    const orderNumber = generateOrderNumber()
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_email: user.email ?? 'dev@test.local',
        subtotal_usd: config.priceUsd,
        tax_amount_usd: 0,
        total_usd: config.priceUsd,
        payment_status: 'paid',
        status: 'paid',
        user_id: user.id,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('add-test-pack order insert error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    await supabase.from('order_items').insert({
      order_id: order.id,
      product_type: `digital_pack_${pack}`,
      unit_price_usd: config.priceUsd,
      quantity: 1,
      subtotal_usd: config.priceUsd,
    })

    await createPackPurchase(supabase, order.id, user.id, pack)

    return NextResponse.json({
      success: true,
      pack,
      orderId: order.id,
      orderNumber,
      generations: config.generations,
      downloads: config.highResDownloads,
    })
  } catch (e) {
    console.error('add-test-pack error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to add test pack' },
      { status: 500 }
    )
  }
}
