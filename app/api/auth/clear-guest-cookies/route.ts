import { NextResponse } from 'next/server'
import { clearGuestCookies } from '@/lib/tokens/guest-tokens-cookie'

/**
 * POST /api/auth/clear-guest-cookies – clears guest_id and guest_tokens_remaining cookies.
 * Call this on logout so the user gets a fresh anonymous guest state (2 credits, no old dev cookie).
 */
export async function POST() {
  const res = NextResponse.json({ ok: true })
  clearGuestCookies(res)
  return res
}
