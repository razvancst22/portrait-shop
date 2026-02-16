import { NextResponse } from 'next/server'

const GENERIC_MESSAGE = 'Something went wrong. Please try again later.'

/**
 * Log the real error server-side and return a 500 response with a generic message
 * so we don't leak internal details to the client.
 */
export function serverErrorResponse(
  error: unknown,
  context?: string
): NextResponse {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(context ? `${context}:` : 'Server error:', message, stack ?? '')
  return NextResponse.json(
    { error: GENERIC_MESSAGE, code: 'INTERNAL_ERROR' },
    { status: 500 }
  )
}
