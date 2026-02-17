import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'

export type MyGenerationItem = {
  id: string
  art_style: string
  status: string
  preview_image_url: string | null
  is_purchased: boolean
  created_at: string
}

/**
 * GET /api/my-generations – list generations for the current guest or logged-in user.
 * Logged-in: session_id = user.id. Guest: session_id = guest_id cookie.
 */
export async function GET() {
  const supabase = createClientIfConfigured()
  if (!supabase) {
    return NextResponse.json({ generations: [] })
  }

  const user = await getOptionalUser()
  const cookieStore = await cookies()
  const sessionId = user?.id ?? cookieStore.get(GUEST_ID_COOKIE)?.value
  if (!sessionId) {
    return NextResponse.json({ generations: [] })
  }

  const { data: rows, error } = await supabase
    .from('generations')
    .select('id, art_style, status, preview_image_url, is_purchased, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('my-generations error:', error)
    return NextResponse.json({ generations: [] })
  }

  const generations: MyGenerationItem[] = (rows ?? []).map((r) => {
    const previewPath = r.preview_image_url
    return {
      id: r.id,
      art_style: r.art_style ?? '',
      status: r.status ?? 'pending',
      preview_image_url: previewPath && typeof previewPath === 'string'
        ? `/api/generate/${r.id}/preview`
        : null,
      is_purchased: r.is_purchased ?? false,
      created_at: r.created_at ?? '',
    }
  })

  return NextResponse.json({ generations })
}
