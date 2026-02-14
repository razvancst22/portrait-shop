import { NextResponse } from 'next/server'

const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

/**
 * GET /api/health – check required env vars. Returns 200 if ok, 503 if any missing.
 * Use for deployment checks or load balancer health.
 */
export async function GET() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim())
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, missing },
      { status: 503 }
    )
  }
  return NextResponse.json({ ok: true })
}
