import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'

/**
 * GET /api/generate/[id]/preview – stream the watermarked preview image.
 * Never exposes the storage URL. Uses no-store so the image isn't cached for reuse.
 * Caller should only use this URL to display the preview (no download).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createClient()

  const { data: gen, error } = await supabase
    .from('generations')
    .select('id, preview_image_url, session_id')
    .eq('id', id)
    .single()

  if (error || !gen?.preview_image_url) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  if (gen.session_id && guestId !== gen.session_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(BUCKET_UPLOADS)
    .download(gen.preview_image_url)

  if (downloadError || !file) {
    return NextResponse.json({ error: 'Preview not available' }, { status: 404 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  })
}
