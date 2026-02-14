import { NextResponse } from 'next/server'

/** Max JSON body size for POST APIs (64KB). */
export const MAX_JSON_BODY_BYTES = 64 * 1024

export function checkJsonBodySize(request: Request): NextResponse | null {
  const contentLength = request.headers.get('content-length')
  if (!contentLength) return null
  const n = parseInt(contentLength, 10)
  if (Number.isNaN(n) || n > MAX_JSON_BODY_BYTES) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
  }
  return null
}
