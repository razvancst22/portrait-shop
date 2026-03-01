import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { BUCKET_UPLOADS } from '@/lib/constants'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'
import { serverErrorResponse } from '@/lib/api-error'

function isStoragePath(str: string | null): boolean {
  return typeof str === 'string' && str.startsWith('uploads/')
}

function collectStoragePaths(gen: {
  original_image_url: string | null
  final_image_url: string | null
  upscaled_image_url: string | null
  preview_image_url: string | null
  reference_image_urls?: unknown
}): string[] {
  const paths: string[] = []
  if (gen.preview_image_url && gen.preview_image_url.startsWith('previews/')) {
    paths.push(gen.preview_image_url)
  }
  if (gen.final_image_url && gen.final_image_url.startsWith('generations/')) {
    paths.push(gen.final_image_url)
  }
  if (gen.upscaled_image_url && gen.upscaled_image_url.startsWith('generations/') && gen.upscaled_image_url !== gen.final_image_url) {
    paths.push(gen.upscaled_image_url)
  }
  if (isStoragePath(gen.original_image_url)) {
    paths.push(gen.original_image_url!)
  }
  if (Array.isArray(gen.reference_image_urls)) {
    for (const item of gen.reference_image_urls) {
      if (typeof item === 'string' && isStoragePath(item)) paths.push(item)
    }
  }
  return [...new Set(paths)]
}

/**
 * DELETE /api/generate/[id] – delete a generation and its storage files.
 * Only the owner (session_id) can delete.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  const user = await getOptionalUser()
  const cookieStore = await cookies()
  const sessionId = user?.id ?? cookieStore.get(GUEST_ID_COOKIE)?.value
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: gen, error: fetchError } = await supabase
    .from('generations')
    .select('id, session_id, is_purchased, original_image_url, final_image_url, upscaled_image_url, preview_image_url, reference_image_urls')
    .eq('id', id)
    .single()

  if (fetchError || !gen) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (gen.session_id !== sessionId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const paths = collectStoragePaths(gen)
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(BUCKET_UPLOADS).remove(paths)
    if (storageError) {
      console.error('DELETE generate: storage delete failed', storageError)
    }
  }

  const { error: deleteError } = await supabase.from('generations').delete().eq('id', id)
  if (deleteError) {
    return serverErrorResponse(deleteError, 'DELETE generate')
  }

  return NextResponse.json({ ok: true })
}

/**
 * PATCH /api/generate/[id] – update generation (e.g. pet_name for email marketing).
 * Body: { petName?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: { petName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const petName =
    typeof body.petName === 'string' ? body.petName.trim().slice(0, 255) : null

  const supabase = createClient()
  const { error } = await supabase
    .from('generations')
    .update({ pet_name: petName || null })
    .eq('id', id)

  if (error) {
    return serverErrorResponse(error, 'PATCH generate')
  }
  return NextResponse.json({ ok: true })
}
