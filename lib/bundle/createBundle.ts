import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_DELIVERABLES } from '@/lib/constants'

/** Bundle = 4 assets: 4:5, 9:16, 4:4 (square), 3:4. Source from AI is 4:5. */
export const BUNDLE_ASSET_TYPES = ['portrait_4_5', 'phone_9_16', 'square_4_4', 'tablet_3_4'] as const

/** Target dimensions. portrait_4_5 preserves 4:5; others are center crop to fill. */
const ASSET_SPECS: Record<(typeof BUNDLE_ASSET_TYPES)[number], { width: number; height: number; fit: 'inside' | 'cover' }> = {
  portrait_4_5: { width: 2048, height: 2048, fit: 'inside' }, // 4:5, max 2048 long edge
  phone_9_16: { width: 1080, height: 1920, fit: 'cover' },   // 9:16 phone wallpaper
  square_4_4: { width: 2048, height: 2048, fit: 'cover' },  // 4:4 (1:1) square
  tablet_3_4: { width: 1536, height: 2048, fit: 'cover' },  // 3:4 tablet
}

/** Minimum long edge for high-res deliverables (same image, no re-generation). */
const MIN_LONG_EDGE = 2048

/**
 * Download image from URL and produce 4 bundle assets (JPEG buffers): 4:5, 9:16, 4:4, 3:4.
 * Same image as preview – we only upscale when needed so purchase is high-res. No AI re-run.
 */
export async function createBundleBuffers(
  sourceImageUrl: string
): Promise<{ asset_type: (typeof BUNDLE_ASSET_TYPES)[number]; buffer: Buffer }[]> {
  const response = await fetch(sourceImageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch source image: ${response.status}`)
  }
  const sourceBuffer = Buffer.from(await response.arrayBuffer())
  let source = sharp(sourceBuffer)
  const metadata = await source.metadata()
  const w = metadata.width ?? 0
  const h = metadata.height ?? 0
  const longEdge = Math.max(w, h)

  if (longEdge > 0 && longEdge < MIN_LONG_EDGE) {
    const scale = MIN_LONG_EDGE / longEdge
    const newW = Math.round(w * scale)
    const newH = Math.round(h * scale)
    const upscaled = await source.resize(newW, newH, { kernel: sharp.kernel.lanczos3 }).toBuffer()
    source = sharp(upscaled)
  }

  const results: { asset_type: (typeof BUNDLE_ASSET_TYPES)[number]; buffer: Buffer }[] = []

  for (const assetType of BUNDLE_ASSET_TYPES) {
    const spec = ASSET_SPECS[assetType]
    const pipeline = source
      .clone()
      .resize(spec.width, spec.height, {
        fit: spec.fit,
        position: 'center',
        withoutEnlargement: spec.fit === 'inside',
      })
    const buffer = await pipeline.jpeg({ quality: 90 }).toBuffer()
    results.push({ asset_type: assetType, buffer })
  }

  return results
}

/**
 * Generate the 4 bundle assets (portrait_4_5, phone_9_16, square_4_4, tablet_3_4) from generation.final_image_url,
 * upload to Storage, insert order_deliverables, and set order status to delivered.
 * Idempotent: if order already has deliverables, skip (only update order status).
 */
export async function generateAndStoreBundle(
  orderId: string,
  generationId: string
): Promise<{ delivered: boolean; error?: string }> {
  const supabase = createClient()

  const { data: gen, error: genError } = await supabase
    .from('generations')
    .select('id, final_image_url')
    .eq('id', generationId)
    .single()

  if (genError || !gen) {
    return { delivered: false, error: 'Generation not found' }
  }

  const finalImageUrl = gen.final_image_url
  if (!finalImageUrl) {
    return { delivered: false, error: 'Generation has no final image' }
  }

  // Optional: skip if we already have deliverables (idempotent)
  const { data: existing } = await supabase
    .from('order_deliverables')
    .select('id')
    .eq('order_id', orderId)
    .limit(1)
  if (existing && existing.length > 0) {
    await supabase.from('orders').update({ status: 'delivered', updated_at: new Date().toISOString() }).eq('id', orderId)
    return { delivered: true }
  }

  const assets = await createBundleBuffers(finalImageUrl)
  const prefix = `orders/${orderId}`

  for (const { asset_type, buffer } of assets) {
    const filePath = `${prefix}/${asset_type}.jpg`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_DELIVERABLES)
      .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true })
    if (uploadError) {
      return { delivered: false, error: `Upload ${asset_type}: ${uploadError.message}` }
    }
    const { error: insertError } = await supabase.from('order_deliverables').insert({
      order_id: orderId,
      asset_type,
      file_path: filePath,
    })
    if (insertError) {
      return { delivered: false, error: `Insert deliverable ${asset_type}: ${insertError.message}` }
    }
  }

  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (orderUpdateError) {
    return { delivered: false, error: orderUpdateError.message }
  }

  return { delivered: true }
}
