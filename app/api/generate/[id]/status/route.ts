import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'
import { createAndUploadWatermark } from '@/lib/image/watermark'
import { generatePortraitFromReference } from '@/lib/ai/gpt-image'
import { upscaleImage, isUpscaleConfigured } from '@/lib/ai/upscale'

const IMAGINE_API_URL = 'https://api.imagineapi.dev/v1'
const TIMEOUT_SECONDS = 5 * 60 // 5 minutes
const GPT_IMAGE_FINAL_PATH_PREFIX = 'generations'
const SIGNED_URL_EXPIRY = 3600 // 1 hour (for watermark step only; final_image_url stored as path)

/**
 * GET /api/generate/[id]/status – poll generation status.
 * Returns { status, previewUrl?, progress?, errorMessage? }.
 * Stub jobs: simulate completed with original as final after 2s.
 * Real jobs: poll ImagineAPI and update DB; timeout after 5 min.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  const { data: gen, error } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !gen) {
    return NextResponse.json(
      { error: 'Generation not found' },
      { status: 404 }
    )
  }

  // Timeout: if generating for too long, mark failed
  const createdAt = new Date(gen.created_at).getTime()
  const elapsed = (Date.now() - createdAt) / 1000
  if (
    (gen.status === 'generating' || gen.status === 'pending') &&
    elapsed > TIMEOUT_SECONDS
  ) {
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: 'Generation timed out. You can try again.',
      })
      .eq('id', id)
    return NextResponse.json({
      status: 'failed',
      errorMessage: 'Generation timed out. You can try again.',
    })
  }

  const jobId = gen.job_id

  /** Return app proxy URL so the client never gets a direct storage URL (prevents easy download). */
  function getPreviewProxyUrl(): string {
    return `/api/generate/${id}/preview`
  }

  // OpenAI GPT Image: run generation only once (first poll to "claim" wins; others just get status)
  if (jobId?.startsWith('openai-') && (gen.status === 'generating' || gen.status === 'pending') && !gen.final_image_url) {
    // Atomic claim: only one status poll may run the OpenAI job (prevents duplicate API calls on refresh/multiple tabs)
    const { data: claimed } = await supabase
      .from('generations')
      .update({ openai_run_started_at: new Date().toISOString() })
      .eq('id', id)
      .is('openai_run_started_at', null)
      .select('id')
      .maybeSingle()

    if (!claimed) {
      return NextResponse.json({
        status: 'generating',
        progress: 50,
        previewUrl: null,
      })
    }

    try {
      const refUrls = gen.reference_image_urls
      const referenceUrls: string[] =
        Array.isArray(refUrls) && refUrls.length > 0
          ? refUrls
          : [gen.original_image_url]
      const imageBuffer = await generatePortraitFromReference(
        referenceUrls.length > 1 ? referenceUrls : referenceUrls[0],
        gen.prompt,
        referenceUrls.length > 1 ? { inputFidelity: 'high' } : undefined
      )
      const finalPath = `${GPT_IMAGE_FINAL_PATH_PREFIX}/${id}_final.png`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_UPLOADS)
        .upload(finalPath, imageBuffer, { contentType: 'image/png', upsert: true })
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }
      const { data: signedData } = await supabase.storage
        .from(BUCKET_UPLOADS)
        .createSignedUrl(finalPath, SIGNED_URL_EXPIRY)
      const finalSignedUrl = signedData?.signedUrl ?? null
      if (!finalSignedUrl) {
        throw new Error('Could not create signed URL for final image')
      }

      let upscaledPath: string | null = null
      if (isUpscaleConfigured()) {
        // Pure upscaling only - no modifications
        const upscaledBuffer = await upscaleImage(finalSignedUrl)
        if (upscaledBuffer && upscaledBuffer.length > 0) {
          const upscaledStoragePath = `${GPT_IMAGE_FINAL_PATH_PREFIX}/${id}_upscaled.png`
          const { error: upscaleUploadError } = await supabase.storage
            .from(BUCKET_UPLOADS)
            .upload(upscaledStoragePath, upscaledBuffer, { contentType: 'image/png', upsert: true })
          if (!upscaleUploadError) {
            upscaledPath = upscaledStoragePath
          }
        }
      }

      const completedAt = new Date().toISOString()
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          completed_at: completedAt,
          final_image_url: finalPath,
          upscaled_image_url: upscaledPath ?? finalPath,
        })
        .eq('id', id)
      try {
        const previewPath = await createAndUploadWatermark(finalSignedUrl, id)
        await supabase
          .from('generations')
          .update({ preview_image_url: previewPath })
          .eq('id', id)
      } catch (e) {
        console.error('Watermark failed:', e)
      }
      return NextResponse.json({
        status: 'completed',
        previewUrl: getPreviewProxyUrl(),
        progress: 100,
        isPurchased: !!gen.is_purchased,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Generation failed'
      console.error('GPT Image generation failed:', e)
      await supabase
        .from('generations')
        .update({
          status: 'failed',
          error_message: message,
        })
        .eq('id', id)
      return NextResponse.json({
        status: 'failed',
        errorMessage: message,
      })
    }
  }

  // If openai job already completed, return current state
  if (jobId?.startsWith('openai-') && gen.status === 'completed') {
    return NextResponse.json({
      status: 'completed',
      previewUrl: gen.preview_image_url ? getPreviewProxyUrl() : null,
      progress: 100,
      isPurchased: !!gen.is_purchased,
    })
  }

  // Stub: simulate completed after ~2s (use original as placeholder final)
  if (jobId?.startsWith('stub-')) {
    if (elapsed > 2 && gen.status === 'generating') {
      const finalUrl = gen.original_image_url
      const completedAt = new Date().toISOString()
      await supabase
        .from('generations')
        .update({
          status: 'completed',
          completed_at: completedAt,
          final_image_url: finalUrl,
          upscaled_image_url: finalUrl,
        })
        .eq('id', id)
      try {
        const previewPath = await createAndUploadWatermark(finalUrl, id)
        await supabase
          .from('generations')
          .update({ preview_image_url: previewPath })
          .eq('id', id)
        return NextResponse.json({
          status: 'completed',
          previewUrl: getPreviewProxyUrl(),
          progress: 100,
          isPurchased: !!gen.is_purchased,
        })
      } catch (e) {
        console.error('Watermark failed:', e)
        return NextResponse.json({
          status: 'completed',
          previewUrl: null,
          progress: 100,
          isPurchased: !!gen.is_purchased,
        })
      }
    }
    return NextResponse.json({
      status: gen.status,
      previewUrl: gen.preview_image_url ? getPreviewProxyUrl() : null,
      progress: elapsed > 1 ? 50 : 10,
      isPurchased: !!gen.is_purchased,
    })
  }

  // Real ImagineAPI job
  const apiKey = process.env.IMAGINE_API_KEY
  if (!apiKey) {
  return NextResponse.json({
    status: gen.status,
    previewUrl: gen.preview_image_url ? getPreviewProxyUrl() : null,
    progress: gen.status === 'completed' ? 100 : 50,
    errorMessage: gen.error_message ?? null,
    isPurchased: !!gen.is_purchased,
  })
  }

  const statusRes = await fetch(`${IMAGINE_API_URL}/status/${jobId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!statusRes.ok) {
    return NextResponse.json({
      status: gen.status,
      previewUrl: gen.preview_image_url ? getPreviewProxyUrl() : null,
      errorMessage: gen.error_message ?? `Status check failed: ${statusRes.status}`,
    })
  }

  const apiData = (await statusRes.json()) as {
    status?: string
    url?: string
    upscaled_urls?: string[]
    error?: string
  }

  const apiStatus = apiData.status ?? gen.status
  // Use base image so preview and purchase are the same; we upscale for bundle only (no re-gen, no surprises).
  const finalUrl = apiData.url ?? apiData.upscaled_urls?.[0]

  if (apiStatus === 'completed' && finalUrl) {
    const completedAt = new Date().toISOString()
    await supabase
      .from('generations')
      .update({
        status: 'completed',
        completed_at: completedAt,
        final_image_url: finalUrl,
        upscaled_image_url: finalUrl,
      })
      .eq('id', id)
    if (!gen.preview_image_url) {
      try {
        const previewPath = await createAndUploadWatermark(finalUrl, id)
        await supabase
          .from('generations')
          .update({ preview_image_url: previewPath })
          .eq('id', id)
      } catch (e) {
        console.error('Watermark failed:', e)
      }
    }
    return NextResponse.json({
      status: 'completed',
      previewUrl: getPreviewProxyUrl(),
      progress: 100,
      isPurchased: !!gen.is_purchased,
    })
  }

  if (apiStatus === 'failed' || apiData.error) {
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: apiData.error ?? 'Generation failed',
      })
      .eq('id', id)
    return NextResponse.json({
      status: 'failed',
      errorMessage: apiData.error ?? 'Generation failed',
      isPurchased: !!gen.is_purchased,
    })
  }

  return NextResponse.json({
    status: apiStatus,
    previewUrl: gen.preview_image_url ? getPreviewProxyUrl() : null,
    progress: apiStatus === 'generating' ? 50 : 25,
    errorMessage: gen.error_message ?? null,
    isPurchased: !!gen.is_purchased,
  })
}
