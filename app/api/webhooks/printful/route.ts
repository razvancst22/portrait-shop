import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendShippedEmail } from '@/lib/email/delivery'

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
    let trackingNumber: string | null = null
    let trackingUrl: string | null = null

    if (type === 'package_shipped') {
      fulfillmentStatus = 'shipped'
      trackingNumber = body.data?.shipment?.tracking_number ?? null
      trackingUrl = body.data?.shipment?.tracking_url ?? null
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

    const updatePayload: Record<string, unknown> = {
      fulfillment_status: fulfillmentStatus,
      updated_at: new Date().toISOString(),
    }
    if (trackingNumber != null) updatePayload.tracking_number = trackingNumber
    if (trackingUrl != null) updatePayload.tracking_url = trackingUrl

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
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
      if (fulfillmentStatus === 'shipped') {
        try {
          await sendShippedEmail(data.id, trackingUrl, trackingNumber)
        } catch (e) {
          console.error('Printful webhook: sendShippedEmail failed', data.id, e)
        }
      }
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
