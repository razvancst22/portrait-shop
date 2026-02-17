import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { verifyDownloadToken } from '@/lib/email/delivery'
import { BUCKET_DELIVERABLES } from '@/lib/constants'
import { DownloadPageClient } from './client-page'

export const metadata: Metadata = {
  title: 'Download your 4K portrait – petportrait.shop',
  description: 'Download your 4K PNG portrait. Link expires in 1 hour. Lost your link? Use order lookup to get a new one.',
}

const SIGNED_URL_EXPIRY = 3600 // 1 hour

const ASSET_LABELS: Record<string, string> = {
  'portrait': 'Portrait (PNG)',
  'upscaled_portrait': 'Upscaled Portrait (PNG)', // Keep backward compatibility
}

async function getDownloadData(token: string | null) {
  if (!token || typeof token !== 'string') return null
  const payload = verifyDownloadToken(token)
  if (!payload) return null

  const supabase = createClient()
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, order_number, status')
    .eq('id', payload.orderId)
    .single()

  if (orderError || !order || order.status !== 'delivered') return null

  const { data: deliverables, error: delError } = await supabase
    .from('order_deliverables')
    .select('asset_type, file_path')
    .eq('order_id', order.id)

  if (delError || !deliverables?.length) return null

  // Also get the generation for final image (non-watermarked)
  const { data: orderItem } = await supabase
    .from('order_items')
    .select('generation_id, generation:generations(preview_image_url, final_image_url)')
    .eq('order_id', order.id)
    .single()

  const downloads: { asset_type: string; url: string; label: string }[] = []
  for (const d of deliverables) {
    const { data: signed } = await supabase.storage
      .from(BUCKET_DELIVERABLES)
      .createSignedUrl(d.file_path, SIGNED_URL_EXPIRY)
    if (signed?.signedUrl) {
      downloads.push({
        asset_type: d.asset_type,
        url: signed.signedUrl,
        label: ASSET_LABELS[d.asset_type] ?? d.asset_type,
      })
    }
  }

  // Use final image (non-watermarked) for purchased items since they've paid
  const finalImageUrl = orderItem?.generation_id 
    ? `/api/generate/${orderItem.generation_id}/final`
    : null

  return { 
    orderNumber: order.order_number, 
    downloads,
    previewImageUrl: finalImageUrl  // Actually the final image, not preview
  }
}

export default async function DownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }> | { token?: string | string[] }
}) {
  const resolved = 'then' in searchParams && typeof searchParams.then === 'function'
    ? await (searchParams as Promise<{ token?: string | string[] }>)
    : (searchParams as { token?: string | string[] })
  const tokenParam = resolved.token
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam

  const data = await getDownloadData(token ?? null)

  return <DownloadPageClient data={data} />
}