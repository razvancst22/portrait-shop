import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'

const PREVIEW_SIGNED_URL_EXPIRY = 3600 // 1 hour

export type MyGenerationItem = {
  id: string
  art_style: string
  status: string
  preview_image_url: string | null
  is_purchased: boolean
  created_at: string
}

/**
 * GET /api/my-generations – list generations for the current guest (or logged-in user).
 * Uses guest_id cookie to match session_id on generations. Works without login.
 * preview_image_url in DB is a storage path; we return a fresh signed URL so thumbnails load.
 */
export async function GET() {
  const supabase = createClientIfConfigured()
  if (!supabase) {
    return NextResponse.json({ generations: [] })
  }

  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value
  if (!guestId) {
    return NextResponse.json({ generations: [] })
  }

  const { data: rows, error } = await supabase
    .from('generations')
    .select('id, art_style, status, preview_image_url, is_purchased, created_at')
    .eq('session_id', guestId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('my-generations error:', error)
    return NextResponse.json({ generations: [] })
  }

  const generations: MyGenerationItem[] = await Promise.all(
    (rows ?? []).map(async (r) => {
      let previewUrl: string | null = null
      const previewPath = r.preview_image_url
      if (previewPath && typeof previewPath === 'string') {
        const { data } = await supabase.storage
          .from(BUCKET_UPLOADS)
          .createSignedUrl(previewPath, PREVIEW_SIGNED_URL_EXPIRY)
        previewUrl = data?.signedUrl ?? null
      }
      return {
        id: r.id,
        art_style: r.art_style ?? '',
        status: r.status ?? 'pending',
        preview_image_url: previewUrl,
        is_purchased: r.is_purchased ?? false,
        created_at: r.created_at ?? '',
      }
    })
  )

  return NextResponse.json({ generations })
}
