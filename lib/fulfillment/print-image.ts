/**
 * Prepare a print-ready image URL for Printful fulfillment.
 * Ensures image is stored and returns a long-lived signed URL Printful can fetch.
 */

import { createClient } from '@/lib/supabase/server'
import { BUCKET_DELIVERABLES, BUCKET_UPLOADS } from '@/lib/constants'
import { upscaleImage, isUpscaleConfigured } from '@/lib/ai/upscale'
import { ensureStorageBuckets } from '@/lib/supabase/storage'
import { validateUrlForFetch, getAllowedImageDomains } from '@/lib/url-validator'

/** Signed URL expiry: 7 days (Printful downloads and caches; they retain 30 days) */
const SIGNED_URL_EXPIRY_SEC = 7 * 24 * 60 * 60

export async function getPrintReadyImageUrl(
  orderId: string,
  generationId: string
): Promise<{ url: string; error?: string }> {
  const supabase = createClient()
  const allowedDomains = getAllowedImageDomains()

  const { data: gen, error: genError } = await supabase
    .from('generations')
    .select('id, final_image_url, upscaled_image_url')
    .eq('id', generationId)
    .single()

  if (genError || !gen) {
    return { url: '', error: 'Generation not found' }
  }

  const hasUpscaled = !!gen.upscaled_image_url
  const imageUrlOrPath = gen.upscaled_image_url || gen.final_image_url
  if (!imageUrlOrPath) {
    return { url: '', error: 'Generation has no image available' }
  }
  if (!hasUpscaled && !isUpscaleConfigured()) {
    return {
      url: '',
      error:
        'Print fulfillment requires an upscaled image. Configure REPLICATE_API_TOKEN for upscaling.',
    }
  }

  const printFilePath = `orders/${orderId}/print_portrait.png`

  // Check if we already have a print image (from previous fulfillment attempt)
  const { data: existing } = await supabase.storage
    .from(BUCKET_DELIVERABLES)
    .list(`orders/${orderId}`)
  const hasPrintFile = existing?.some((f) => f.name === 'print_portrait.png')

  if (hasPrintFile) {
    const { data } = await supabase.storage
      .from(BUCKET_DELIVERABLES)
      .createSignedUrl(printFilePath, SIGNED_URL_EXPIRY_SEC)
    if (data?.signedUrl) {
      return { url: data.signedUrl }
    }
  }

  // Resolve source URL
  let sourceImageUrl: string
  if (imageUrlOrPath.startsWith('http')) {
    sourceImageUrl = imageUrlOrPath
  } else {
    const { data } = await supabase.storage
      .from(BUCKET_UPLOADS)
      .createSignedUrl(imageUrlOrPath, 3600)
    if (!data?.signedUrl) {
      return { url: '', error: 'Could not get source image URL' }
    }
    sourceImageUrl = data.signedUrl
  }

  const validation = validateUrlForFetch(sourceImageUrl, allowedDomains)
  if (!validation.valid) {
    return { url: '', error: `Invalid image URL: ${validation.error}` }
  }

  let finalBuffer: Buffer
  if (hasUpscaled) {
    // Use existing upscaled image directly
    const response = await fetch(sourceImageUrl)
    if (!response.ok) return { url: '', error: 'Failed to fetch upscaled image' }
    finalBuffer = Buffer.from(await response.arrayBuffer())
  } else {
    // Must upscale; we already verified isUpscaleConfigured() above
    const upscaledBuffer = await upscaleImage(sourceImageUrl, 2)
    if (!upscaledBuffer) {
      return { url: '', error: 'Upscale failed. Print fulfillment requires an upscaled image.' }
    }
    finalBuffer = upscaledBuffer
  }

  let { error: uploadError } = await supabase.storage
    .from(BUCKET_DELIVERABLES)
    .upload(printFilePath, finalBuffer, { contentType: 'image/png', upsert: true })

  if (uploadError?.message?.includes('Bucket not found')) {
    await ensureStorageBuckets()
    const retry = await supabase.storage
      .from(BUCKET_DELIVERABLES)
      .upload(printFilePath, finalBuffer, { contentType: 'image/png', upsert: true })
    uploadError = retry.error
  }

  if (uploadError) {
    return { url: '', error: `Failed to upload print image: ${uploadError.message}` }
  }

  const { data } = await supabase.storage
    .from(BUCKET_DELIVERABLES)
    .createSignedUrl(printFilePath, SIGNED_URL_EXPIRY_SEC)

  if (!data?.signedUrl) {
    return { url: '', error: 'Could not create signed URL' }
  }

  return { url: data.signedUrl }
}
