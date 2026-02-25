import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/webhooks/printful – Printful fulfillment callbacks.
 * Handles package_shipped, order_updated, order_canceled, order_failed.
 * Configure webhook URL in Printful Dashboard → Settings → Webhooks.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      type?: string
      data?: {
        order?: {
          id?: number
          external_id?: string
          status?: string
        }
        shipment?: {
          id?: number
          tracking_url?: string
          tracking_number?: string
        }
      }
    }

    const type = body.type
    const order = body.data?.order
    const externalId = order?.external_id

    if (!externalId) {
      console.error('Printful webhook: missing order.external_id in payload')
      return NextResponse.json({ error: 'Missing external_id' }, { status: 400 })
    }

    let fulfillmentStatus: string
    if (type === 'package_shipped') {
      fulfillmentStatus = 'shipped'
    } else if (type === 'order_canceled' || type === 'order_failed') {
      fulfillmentStatus = 'cancelled'
    } else if (type === 'order_updated') {
      const status = order?.status
      if (status === 'fulfilled') {
        fulfillmentStatus = 'shipped'
      } else if (status === 'canceled' || status === 'failed') {
        fulfillmentStatus = 'cancelled'
      } else {
        fulfillmentStatus = 'processing'
      }
    } else {
      return NextResponse.json({ received: true })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .update({
        fulfillment_status: fulfillmentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', externalId)
      .select('id, order_number')
      .maybeSingle()

    if (error) {
      console.error('Printful webhook: update failed', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (data) {
      console.log(
        `Printful webhook: order ${data.order_number} (${data.id}) → ${fulfillmentStatus}`
      )
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('Printful webhook error', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Webhook error' },
      { status: 500 }
    )
  }
}
