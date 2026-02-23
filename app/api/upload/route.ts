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

/**
 * POST /api/upload – accept a pet photo, validate, upload to Storage, return imageUrl.
 * No generations row is created here (that happens in the generate API).
 * The returned imageUrl expires in UPLOAD_SIGNED_URL_EXPIRY_SECONDS; use it for generate within that time.
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
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

    const supabase = createClientIfConfigured()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and keys to enable uploads.' },
        { status: 503 }
      )
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

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

    return NextResponse.json({ imageUrl: signedData.signedUrl, path: data.path })
  } catch (e) {
    return serverErrorResponse(e, 'Upload')
  }
}
