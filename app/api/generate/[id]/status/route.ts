import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'
import { createAndUploadWatermark } from '@/lib/image/watermark'

const IMAGINE_API_URL = 'https://api.imagineapi.dev/v1'
const TIMEOUT_SECONDS = 5 * 60 // 5 minutes
const SIGNED_URL_EXPIRY = 3600 // 1 hour for preview link

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

  const jobId = gen.midjourney_job_id

  async function getPreviewSignedUrl(path: string | null): Promise<string | null> {
    if (!path) return null
    const { data } = await supabase.storage
      .from(BUCKET_UPLOADS)
      .createSignedUrl(path, SIGNED_URL_EXPIRY)
    return data?.signedUrl ?? null
  }

  // Stub: simulate completed after ~2s (use original as placeholder final)
  if (jobId?.startsWith('stub-')) {
    if (elapsed > 2 && gen.status === 'generating') {
      const finalUrl = gen.original_image_url
      await supabase
        .from('generations')
        .update({
          status: 'completed',
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
        const previewUrl = await getPreviewSignedUrl(previewPath)
        return NextResponse.json({
          status: 'completed',
          previewUrl,
          progress: 100,
        })
      } catch (e) {
        console.error('Watermark failed:', e)
        return NextResponse.json({
          status: 'completed',
          previewUrl: null,
          progress: 100,
        })
      }
    }
    const previewUrl = gen.preview_image_url
      ? await getPreviewSignedUrl(gen.preview_image_url)
      : null
    return NextResponse.json({
      status: gen.status,
      previewUrl,
      progress: elapsed > 1 ? 50 : 10,
    })
  }

  // Real ImagineAPI job
  const apiKey = process.env.IMAGINE_API_KEY
  if (!apiKey) {
    const previewUrl = gen.preview_image_url
      ? await getPreviewSignedUrl(gen.preview_image_url)
      : null
    return NextResponse.json({
      status: gen.status,
      previewUrl,
      progress: gen.status === 'completed' ? 100 : 50,
      errorMessage: gen.error_message ?? null,
    })
  }

  const statusRes = await fetch(`${IMAGINE_API_URL}/status/${jobId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!statusRes.ok) {
    const previewUrl = gen.preview_image_url
      ? await getPreviewSignedUrl(gen.preview_image_url)
      : null
    return NextResponse.json({
      status: gen.status,
      previewUrl,
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
    await supabase
      .from('generations')
      .update({
        status: 'completed',
        final_image_url: finalUrl,
        upscaled_image_url: finalUrl,
      })
      .eq('id', id)
    let previewUrl: string | null = null
    if (!gen.preview_image_url) {
      try {
        const previewPath = await createAndUploadWatermark(finalUrl, id)
        await supabase
          .from('generations')
          .update({ preview_image_url: previewPath })
          .eq('id', id)
        previewUrl = await getPreviewSignedUrl(previewPath)
      } catch (e) {
        console.error('Watermark failed:', e)
      }
    } else {
      previewUrl = await getPreviewSignedUrl(gen.preview_image_url)
    }
    return NextResponse.json({
      status: 'completed',
      previewUrl,
      progress: 100,
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
    })
  }

  const previewUrl = gen.preview_image_url
    ? await getPreviewSignedUrl(gen.preview_image_url)
    : null
  return NextResponse.json({
    status: apiStatus,
    previewUrl,
    progress: apiStatus === 'generating' ? 50 : 25,
    errorMessage: gen.error_message ?? null,
  })
}
