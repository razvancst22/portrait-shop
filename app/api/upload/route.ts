import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * POST /api/upload – accept a pet photo, validate, upload to Storage, return imageUrl.
 * No generations row is created here (that happens in the generate API).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') ?? formData.get('image')
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Missing file. Send as form field "file" or "image".' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(BUCKET_UPLOADS)
      .upload(path, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: signedData, error: signError } = await supabase.storage
      .from(BUCKET_UPLOADS)
      .createSignedUrl(data.path, 3600) // 1 hour for generate step

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: signError?.message ?? 'Upload succeeded but could not create URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ imageUrl: signedData.signedUrl, path: data.path })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
