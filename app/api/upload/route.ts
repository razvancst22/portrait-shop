import { NextRequest, NextResponse } from 'next/server'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'
import { serverErrorResponse } from '@/lib/api-error'
import { checkRateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/request-utils'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Signed URL expiry in seconds. Use the uploaded photo in create flow within this window or the generate step may fail to fetch the reference image. */
const UPLOAD_SIGNED_URL_EXPIRY_SECONDS = 7200 // 2 hours

const MAX_FILES_MULTI = 6

/**
 * POST /api/upload – accept one or more photos, validate, upload to Storage.
 * Single file: send "file" or "image" → returns { imageUrl, path }
 * Multiple files: send multiple "file" entries → returns { imageUrls, paths }
 * Max 6 files (family); each file max 10MB.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit(ip, request.nextUrl.pathname)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many upload attempts. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfterSeconds.toString(),
        },
      }
    )
  }
  try {
    const formData = await request.formData()
    const allFiles = formData.getAll('file').filter((f): f is File => f instanceof File)
    const singleFile = formData.get('file') ?? formData.get('image')
    const files: File[] =
      allFiles.length > 0
        ? allFiles
        : singleFile instanceof File
          ? [singleFile]
          : []

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Missing file(s). Send as "file", "image", or multiple "file" entries.' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES_MULTI) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES_MULTI} files allowed.` },
        { status: 400 }
      )
    }

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      if (!ALLOWED_TYPES.includes(f.type)) {
        return NextResponse.json(
          { error: `File ${i + 1}: Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
          { status: 400 }
        )
      }
      if (f.size > MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File ${i + 1}: Too large. Max ${MAX_SIZE_BYTES / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
    }

    const supabase = createClientIfConfigured()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and keys to enable uploads.' },
        { status: 503 }
      )
    }

    const imageUrls: string[] = []
    const paths: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${i}.${ext}`

      const { data, error } = await supabase.storage
        .from(BUCKET_UPLOADS)
        .upload(path, await file.arrayBuffer(), {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        return serverErrorResponse(error, 'Upload')
      }

      const { data: signedData, error: signError } = await supabase.storage
        .from(BUCKET_UPLOADS)
        .createSignedUrl(data.path, UPLOAD_SIGNED_URL_EXPIRY_SECONDS)

      if (signError || !signedData?.signedUrl) {
        return serverErrorResponse(signError ?? new Error('No signed URL'), 'Upload signed URL')
      }

      imageUrls.push(signedData.signedUrl)
      paths.push(data.path)
    }

    if (imageUrls.length === 1) {
      return NextResponse.json({ imageUrl: imageUrls[0], path: paths[0] })
    }
    return NextResponse.json({ imageUrls, paths })
  } catch (e) {
    return serverErrorResponse(e, 'Upload')
  }
}
