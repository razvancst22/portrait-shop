import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_LIMIT_PATHS = ['/api/upload', '/api/generate', '/api/checkout', '/api/order-lookup']

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown'
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  if (method === 'POST' && RATE_LIMIT_PATHS.some((p) => pathname.startsWith(p))) {
    const ip = getClientIp(request)
    const { allowed, retryAfterSeconds } = checkRateLimit(ip, pathname)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
          },
        }
      )
    }
  }

  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    '/api/upload',
    '/api/upload/:path*',
    '/api/generate',
    '/api/generate/:path*',
    '/api/checkout',
    '/api/order-lookup',
    '/:path*',
  ],
}
