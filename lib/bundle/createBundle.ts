import { createClient } from '@/lib/supabase/server'
import { BUCKET_DELIVERABLES, BUCKET_UPLOADS } from '@/lib/constants'
import { upscaleImage, isUpscaleConfigured } from '@/lib/ai/upscale'
import { ensureStorageBuckets } from '@/lib/supabase/storage'
import { validateUrlForFetch, getAllowedImageDomains } from '@/lib/url-validator'

/**
 * Generate a single 4K PNG from generation.final_image_url using Replicate upscale,
 * upload to Storage, insert order_deliverables, and set order status to delivered.
 * Idempotent: if order already has deliverables, skip (only update order status).
 */
export async function generateAndStoreBundle(
  orderId: string,
  generationId: string
): Promise<{ delivered: boolean; error?: string }> {
  const supabase = createClient()
  const allowedDomains = getAllowedImageDomains()

  const { data: gen, error: genError } = await supabase
    .from('generations')
    .select('id, final_image_url, upscaled_image_url')
    .eq('id', generationId)
    .single()

  if (genError || !gen) {
    return { delivered: false, error: 'Generation not found' }
  }

  // Prefer upscaled version if available, otherwise use final image
  const imageUrlOrPath = gen.upscaled_image_url || gen.final_image_url
  if (!imageUrlOrPath) {
    return { delivered: false, error: 'Generation has no image available' }
  }
  
  console.log('Using image:', imageUrlOrPath)
  console.log('Has upscaled version:', !!gen.upscaled_image_url)

  // If we already have an upscaled version, just download it as PNG instead of calling Replicate again
  if (gen.upscaled_image_url && gen.upscaled_image_url !== gen.final_image_url) {
    console.log('Using existing upscaled image, skipping Replicate call')
    
    let upscaledUrl: string
    if (gen.upscaled_image_url.startsWith('http')) {
      upscaledUrl = gen.upscaled_image_url
    } else {
      const { data } = await supabase.storage
        .from(BUCKET_UPLOADS)
        .createSignedUrl(gen.upscaled_image_url, 3600)
      if (!data?.signedUrl) {
        return { delivered: false, error: 'Could not get upscaled image URL' }
      }
      upscaledUrl = data.signedUrl
    }
    
    // Validate URL before fetching
    const validation = validateUrlForFetch(upscaledUrl, allowedDomains)
    if (!validation.valid) {
      return { delivered: false, error: `Invalid upscaled image URL: ${validation.error}` }
    }

    // Download existing upscaled image
    const validation = validateUrlForFetch(upscaledUrl, allowedDomains)
    if (!validation.valid) {
      return { delivered: false, error: `Invalid upscaled image URL: ${validation.error}` }
    }
    const response = await fetch(upscaledUrl)
    if (!response.ok) {
      return { delivered: false, error: 'Failed to fetch existing upscaled image' }
    }
    const upscaled4kBuffer = Buffer.from(await response.arrayBuffer())
    
    // Store it
    const filePath = `orders/${orderId}/upscaled_portrait.png`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_DELIVERABLES)
      .upload(filePath, upscaled4kBuffer, { contentType: 'image/png', upsert: true })
    
    if (uploadError) {
      return { delivered: false, error: `Failed to upload existing upscaled PNG: ${uploadError.message}` }
    }

    // Insert deliverable record
    const { error: insertError } = await supabase.from('order_deliverables').insert({
      order_id: orderId,
      asset_type: 'upscaled_portrait',
      file_path: filePath,
    })
    
    if (insertError) {
      return { delivered: false, error: `Failed to insert deliverable record: ${insertError.message}` }
    }

    // Mark order as delivered
    await supabase.from('orders').update({ status: 'delivered', updated_at: new Date().toISOString() }).eq('id', orderId)
    return { delivered: true }
  }

  // Resolve storage path to signed URL when needed (e.g. GPT Image stores path)
  let sourceImageUrl: string
  if (imageUrlOrPath.startsWith('http')) {
    sourceImageUrl = imageUrlOrPath
    console.log('Using direct HTTP URL:', sourceImageUrl)
  } else {
    const { data } = await supabase.storage
      .from(BUCKET_UPLOADS)
      .createSignedUrl(imageUrlOrPath, 3600)
    if (!data?.signedUrl) {
      return { delivered: false, error: 'Could not get final image URL' }
    }
    sourceImageUrl = data.signedUrl
    console.log('Created signed URL:', sourceImageUrl)
    console.log('Original path:', imageUrlOrPath)
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

  let finalBuffer: Buffer

  // Try to upscale with Replicate, fall back to original if it fails
  if (isUpscaleConfigured()) {
    console.log('Attempting Replicate upscale...')
    const upscaledBuffer = await upscaleImage(sourceImageUrl, 2)
    if (upscaledBuffer) {
      console.log('Replicate upscale successful')
      finalBuffer = upscaledBuffer
    } else {
      console.log('Replicate upscale failed, using original image')
      // Validate URL before fetching
      const validation = validateUrlForFetch(sourceImageUrl, allowedDomains)
      if (!validation.valid) {
        return { delivered: false, error: `Invalid source image URL: ${validation.error}` }
      }
      // Fallback: download original image
      const response = await fetch(sourceImageUrl)
      if (!response.ok) {
        return { delivered: false, error: 'Failed to fetch source image' }
      }
      finalBuffer = Buffer.from(await response.arrayBuffer())
    }
  } else {
    console.log('Replicate not configured, using original image')
    // Validate URL before fetching
    const validation = validateUrlForFetch(sourceImageUrl, allowedDomains)
    if (!validation.valid) {
      return { delivered: false, error: `Invalid source image URL: ${validation.error}` }
    }
    // Fallback: download original image
    const response = await fetch(sourceImageUrl)
    if (!response.ok) {
      return { delivered: false, error: 'Failed to fetch source image' }
    }
    finalBuffer = Buffer.from(await response.arrayBuffer())
  }

  // Store single PNG (upscaled or original)
  const filePath = `orders/${orderId}/portrait.png`
  let { error: uploadError } = await supabase.storage
    .from(BUCKET_DELIVERABLES)
    .upload(filePath, finalBuffer, { contentType: 'image/png', upsert: true })
  
  // If bucket doesn't exist, create it and try again
  if (uploadError && uploadError.message.includes('Bucket not found')) {
    console.log('Deliverables bucket not found, creating storage buckets...')
    try {
      await ensureStorageBuckets()
      console.log('Storage buckets created, retrying upload...')
      const retry = await supabase.storage
        .from(BUCKET_DELIVERABLES)
        .upload(filePath, finalBuffer, { contentType: 'image/png', upsert: true })
      uploadError = retry.error
    } catch (e) {
      console.error('Failed to create storage buckets:', e)
    }
  }
  
  if (uploadError) {
    return { delivered: false, error: `Failed to upload PNG: ${uploadError.message}` }
  }

  // Insert single deliverable record
  const { error: insertError } = await supabase.from('order_deliverables').insert({
    order_id: orderId,
    asset_type: 'portrait',
    file_path: filePath,
  })
  
  if (insertError) {
    return { delivered: false, error: `Failed to insert deliverable record: ${insertError.message}` }
  }

  // Mark order as delivered
  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (orderUpdateError) {
    return { delivered: false, error: orderUpdateError.message }
  }

  return { delivered: true }
}
