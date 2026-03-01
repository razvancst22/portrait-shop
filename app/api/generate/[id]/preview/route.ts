import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { BUCKET_UPLOADS } from '@/lib/constants'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'

const THUMBNAIL_WIDTH = 400
const THUMBNAIL_QUALITY = 80

/**
 * GET /api/generate/[id]/preview – stream the watermarked preview image.
 * Query param ?w=400 returns a thumbnail for grid display (smaller, cached).
 * Without ?w, returns full preview. Never exposes the storage URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  const widthParam = url.searchParams.get('w')
  const wantThumbnail = widthParam !== null
  const thumbWidth = wantThumbnail ? Math.min(1200, Math.max(100, parseInt(widthParam || String(THUMBNAIL_WIDTH), 10) || THUMBNAIL_WIDTH)) : null

  const supabase = createClient()

  const { data: gen, error } = await supabase
    .from('generations')
    .select('id, preview_image_url, session_id')
    .eq('id', id)
    .single()

  if (error || !gen?.preview_image_url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const user = await getOptionalUser()
  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const canView = !gen.session_id || user?.id === gen.session_id || guestId === gen.session_id
  if (!canView) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(BUCKET_UPLOADS)
    .download(gen.preview_image_url)

  if (downloadError || !file) {
    return NextResponse.json({ error: 'Preview not available' }, { status: 404 })
  }

  let body: Uint8Array
  if (thumbWidth) {
    const raw = Buffer.from(await file.arrayBuffer())
    const resized = await sharp(raw)
      .resize(thumbWidth, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toBuffer()
    body = new Uint8Array(resized)
  } else {
    body = new Uint8Array(await file.arrayBuffer())
  }

  // Longer cache = fewer Supabase egress hits. Thumbnails are immutable; full preview cached 7 days.
  const cacheControl = thumbWidth
    ? 'public, max-age=604800, immutable'
    : 'public, max-age=604800'

  return new NextResponse(body as BodyInit, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': cacheControl,
    },
  })
}
