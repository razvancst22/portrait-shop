/**
 * Process art print orders by sending them to Printful after payment.
 * Called from Stripe webhook when productType === 'art_print' and FULFILLMENT_PROVIDER=printful.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createPrintfulOrder,
  mapStripeAddressToPrintfulRecipient,
  PRINT_TO_PRINTFUL_VARIANT_ID,
} from './printful'
import { getPrintReadyImageUrl } from './print-image'

export type OrderWithItems = {
  id: string
  order_number: string
  customer_email: string | null
  [key: string]: unknown
}

export type OrderItemWithGeneration = {
  id: string
  product_type: string
  generation_id: string | null
  print_dimensions: string | null
  [key: string]: unknown
}

export type StripeShippingDetails = {
  name?: string
  address?: {
    line1?: string
    line2?: string | null
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
}

export async function processPrintfulFulfillment(
  supabase: SupabaseClient,
  order: OrderWithItems,
  orderItems: OrderItemWithGeneration[],
  stripeShipping: StripeShippingDetails | null,
  stripeEmail: string | null
): Promise<{ success: boolean; printfulOrderId?: number; error?: string }> {
  const artItems = orderItems.filter(
    (i) => i.product_type === 'art_print' && i.generation_id
  )
  if (artItems.length === 0) {
    return { success: true }
  }

  if (!process.env.PRINTFUL_API_TOKEN) {
    return {
      success: false,
      error: 'PRINTFUL_API_TOKEN is not configured. Set it to fulfill art prints.',
    }
  }

  if (!stripeShipping?.address?.line1) {
    return {
      success: false,
      error: 'Missing shipping address from Stripe for art print order',
    }
  }

  const recipient = mapStripeAddressToPrintfulRecipient(
    stripeShipping,
    stripeEmail
  )

  const items: Array<{
    variant_id: number
    quantity: number
    files: Array<{ url: string }>
    external_id?: string
  }> = []

  for (const item of artItems) {
    const dims = item.print_dimensions ?? '12×16"'
    const variantId = PRINT_TO_PRINTFUL_VARIANT_ID[dims]
    if (!variantId) {
      return {
        success: false,
        error: `Unknown print size for Printful: ${dims}`,
      }
    }
    if (variantId === 0) {
      return {
        success: false,
        error: `Printful variant ID for ${dims} not configured. Run GET /products?category_id=56 to find variant IDs and update PRINT_TO_PRINTFUL_VARIANT_ID in lib/fulfillment/printful.ts. See docs/PRINTFUL_SETUP.md.`,
      }
    }

    const { url, error } = await getPrintReadyImageUrl(order.id, item.generation_id!)
    if (error || !url) {
      return {
        success: false,
        error: `Could not prepare print image: ${error ?? 'unknown'}`,
      }
    }

    items.push({
      variant_id: variantId,
      quantity: 1,
      files: [{ url }],
      external_id: `order_item_${item.id}`,
    })
  }

  try {
    const response = await createPrintfulOrder(
      {
        external_id: order.id,
        shipping: 'STANDARD',
        recipient,
        items,
      },
      { confirm: true }
    )

    const printfulOrderId = response.result?.id
    if (!printfulOrderId) {
      return {
        success: false,
        error:
          response.error?.message ?? 'Printful did not return order ID',
      }
    }

    await supabase
      .from('orders')
      .update({
        fulfillment_status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    return { success: true, printfulOrderId }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { success: false, error: err }
  }
}
