import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'
import { createDownloadToken } from '@/lib/email/delivery'
import { serverErrorResponse } from '@/lib/api-error'

/**
 * GET /api/download/[generationId] – create download link for already purchased generation.
 * Checks ownership and purchase status, then creates download token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ generationId: string }> }
) {
  const { generationId } = await params
  const supabase = createClient()

  // Get generation and check if purchased
  const { data: gen, error: genError } = await supabase
    .from('generations')
    .select('id, session_id, is_purchased')
    .eq('id', generationId)
    .single()

  if (genError || !gen) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  if (!gen.is_purchased) {
    return NextResponse.json({ error: 'Generation not purchased' }, { status: 403 })
  }

  // Check ownership
  const user = await getOptionalUser()
  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const isOwner = gen.session_id && (user?.id === gen.session_id || guestId === gen.session_id)

  if (gen.session_id && !isOwner) {
    return NextResponse.json(
      { error: 'You can only download portraits you created.' },
      { status: 403 }
    )
  }

  // Find any paid order for this generation (not just delivered)
  const { data: orderItems, error: orderError } = await supabase
    .from('order_items')
    .select(`
      order:orders!inner (
        id,
        status,
        payment_status,
        created_at
      )
    `)
    .eq('generation_id', generationId)
    .eq('orders.payment_status', 'paid')

  if (orderError || !orderItems || orderItems.length === 0) {
    return NextResponse.json({ error: 'No paid order found for this generation' }, { status: 404 })
  }

  // Sort by created_at descending and get most recent
  const sortedOrders = orderItems.sort((a: any, b: any) =>
    new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime()
  )
  const orderItem = sortedOrders[0]

  const orderId = (orderItem.order as any).id
  const orderStatus = (orderItem.order as any).status

  try {
    // If order isn't delivered yet, try to generate bundle first
    if (orderStatus !== 'delivered') {
      const { generateAndStoreBundle } = await import('@/lib/bundle/createBundle')
      const result = await generateAndStoreBundle(orderId, generationId)

      if (!result.delivered) {
        return NextResponse.json({
          error: `Bundle not ready: ${result.error}`
        }, { status: 500 })
      }
    }

    // Create download token
    const downloadToken = createDownloadToken(orderId)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
    const downloadUrl = `${baseUrl}/download?token=${encodeURIComponent(downloadToken)}`

    return NextResponse.json({
      downloadUrl,
    })
  } catch (e) {
    return serverErrorResponse(e, 'Create download token')
  }
}