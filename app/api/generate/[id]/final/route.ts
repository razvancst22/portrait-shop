import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'
import { BUCKET_UPLOADS } from '@/lib/constants'

const DISPLAY_MAX_WIDTH = 1200
const DISPLAY_QUALITY = 88

/**
 * GET /api/generate/[id]/final – stream the final (non-watermarked) image for purchased generations.
 * Query param ?w=1200 returns a display-sized image for fast loading; without ?w, streams full 4K.
 * Only accessible if the generation is purchased and user owns it.
 * Full-resolution download goes via /api/download and /download page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = new URL(request.url)
  const widthParam = url.searchParams.get('w')
  const displayWidth = widthParam
    ? Math.min(1600, Math.max(200, parseInt(widthParam, 10) || DISPLAY_MAX_WIDTH))
    : null

  const supabase = createClient()

  const { data: gen, error } = await supabase
    .from('generations')
    .select('id, final_image_url, session_id, is_purchased')
    .eq('id', id)
    .single()

  if (error || !gen?.final_image_url) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Check if purchased
  if (!gen.is_purchased) {
    return new NextResponse('Not purchased', { status: 403 })
  }

  // Check ownership
  const user = await getOptionalUser()
  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  const isOwner = gen.session_id && (user?.id === gen.session_id || guestId === gen.session_id)

  if (gen.session_id && !isOwner) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(BUCKET_UPLOADS)
    .download(gen.final_image_url)

  if (downloadError || !file) {
    return new NextResponse('Could not fetch image', { status: 500 })
  }

  const contentType = file.type || 'image/png'

  let body: Uint8Array
  if (displayWidth) {
    const raw = Buffer.from(await file.arrayBuffer())
    const resized = await sharp(raw)
      .resize(displayWidth, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: DISPLAY_QUALITY })
      .toBuffer()
    body = new Uint8Array(resized)
  } else {
    body = new Uint8Array(await file.arrayBuffer())
  }

  const cacheControl = displayWidth
    ? 'private, max-age=3600'
    : 'private, max-age=0'

  return new NextResponse(body as BodyInit, {
    headers: {
      'Content-Type': displayWidth ? 'image/jpeg' : contentType,
      'Cache-Control': cacheControl,
    },
  })
}