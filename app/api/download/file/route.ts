import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyDownloadToken } from '@/lib/email/delivery'
import { BUCKET_DELIVERABLES } from '@/lib/constants'

/**
 * GET /api/download/file?token={token} – proxy download with Content-Disposition: attachment.
 * Forces browser to download the file instead of opening it in a new tab.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token || typeof token !== 'string') {
    return new NextResponse('Missing token', { status: 400 })
  }

  const payload = verifyDownloadToken(token)
  if (!payload) {
    return new NextResponse('Invalid or expired token', { status: 403 })
  }

  const supabase = createClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, status')
    .eq('id', payload.orderId)
    .single()

  if (orderError || !order || order.status !== 'delivered') {
    return new NextResponse('Order not found or not ready', { status: 404 })
  }

  const { data: deliverables, error: delError } = await supabase
    .from('order_deliverables')
    .select('asset_type, file_path')
    .eq('order_id', order.id)

  if (delError || !deliverables?.length) {
    return new NextResponse('No deliverables found', { status: 404 })
  }

  const first = deliverables[0]
  const { data: file, error: downloadError } = await supabase.storage
    .from(BUCKET_DELIVERABLES)
    .download(first.file_path)

  if (downloadError || !file) {
    return new NextResponse('Could not fetch file', { status: 500 })
  }

  const filename = `portrait-${order.order_number}.png`
  return new NextResponse(file.stream(), {
    headers: {
      'Content-Type': file.type || 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  })
}
