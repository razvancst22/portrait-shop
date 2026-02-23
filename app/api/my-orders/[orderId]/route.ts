import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { createDownloadToken } from '@/lib/email/delivery'

type GenerationEmbed = {
  preview_image_url: string | null
  final_image_url: string | null
  art_style: string | null
}

type OrderItemRow = {
  id: string
  product_type: string
  generation_id: string | null
  unit_price_usd: number
  quantity: number
  subtotal_usd: number
  generations?: GenerationEmbed | GenerationEmbed[] | null
}

type OrderRow = {
  id: string
  order_number: string
  created_at: string
  status: string
  total_usd: number
  customer_email: string | null
  user_id?: string | null
}

/**
 * GET /api/my-orders/[orderId] – single order detail for the logged-in user.
 * Returns order + items + downloadUrl (if delivered).
 * Verifies ownership via user_id or customer_email.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const user = await getOptionalUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, created_at, status, total_usd, customer_email, user_id')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const orderRow = order as OrderRow
  const emailLower = user.email.trim().toLowerCase()
  const orderEmail = (orderRow.customer_email || '').trim().toLowerCase()
  const ownsOrder =
    orderRow.user_id === user.id || orderEmail === emailLower

  if (!ownsOrder) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      id,
      product_type,
      generation_id,
      unit_price_usd,
      quantity,
      subtotal_usd,
      generations(preview_image_url, final_image_url, art_style)
    `)
    .eq('order_id', orderId)

  if (itemsError) {
    return NextResponse.json({ error: 'Failed to load order items' }, { status: 500 })
  }

  let downloadUrl: string | null = null
  if (orderRow.status === 'delivered') {
    const token = createDownloadToken(orderRow.id)
    downloadUrl = `/download?token=${encodeURIComponent(token)}`
  }

  const lineItems = (items ?? []).map((item: OrderItemRow) => {
    const raw = item.generations
    const gen = Array.isArray(raw) ? raw[0] ?? null : raw ?? null
    return {
      id: item.id,
      productType: item.product_type,
      generationId: item.generation_id,
      unitPriceUsd: Number(item.unit_price_usd) || 0,
      quantity: item.quantity,
      subtotalUsd: Number(item.subtotal_usd) || 0,
      previewImageUrl: gen?.preview_image_url ?? null,
      finalImageUrl: gen?.final_image_url ?? null,
      artStyle: gen?.art_style ?? null,
    }
  })

  return NextResponse.json({
    order: {
      id: orderRow.id,
      orderNumber: orderRow.order_number,
      createdAt: orderRow.created_at,
      status: orderRow.status,
      totalUsd: Number(orderRow.total_usd) || 0,
    },
    items: lineItems,
    downloadUrl,
  })
}
