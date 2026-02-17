import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'
import { BUCKET_UPLOADS } from '@/lib/constants'

/**
 * GET /api/generate/[id]/final – stream the final (non-watermarked) image for purchased generations.
 * Only accessible if the generation is purchased and user owns it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  // Get the final image
  let imageUrl: string
  if (gen.final_image_url.startsWith('http')) {
    imageUrl = gen.final_image_url
  } else {
    const { data } = await supabase.storage
      .from(BUCKET_UPLOADS)
      .createSignedUrl(gen.final_image_url, 300) // 5 min expiry
    if (!data?.signedUrl) {
      return new NextResponse('Could not get image', { status: 500 })
    }
    imageUrl = data.signedUrl
  }

  // Fetch and stream the image
  const { data: file, error: downloadError } = await supabase.storage
    .from(BUCKET_UPLOADS)
    .download(gen.final_image_url)

  if (downloadError || !file) {
    return new NextResponse('Could not fetch image', { status: 500 })
  }

  return new NextResponse(file.stream(), {
    headers: {
      'Content-Type': file.type || 'image/png',
      'Cache-Control': 'private, no-store, max-age=0',
    },
  })
}