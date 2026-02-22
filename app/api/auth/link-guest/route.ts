import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { linkGuestToUser } from '@/lib/auth/link-guest-to-user'
import { expireGuestAndPostLogoutCookies } from '@/lib/tokens/guest-tokens-cookie'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'

/**
 * POST /api/auth/link-guest – link guest generations and token usage to the current user.
 * Call after sign-in (password) since auth callback only runs for email confirmation / OAuth.
 * Idempotent: safe to call multiple times.
 */
export async function POST() {
  const user = await getOptionalUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value

  const res = NextResponse.json({ ok: true })

  if (guestId) {
    const supabase = createClientIfConfigured()
    if (supabase) {
      try {
        await linkGuestToUser(supabase, user.id, guestId)
      } catch (e) {
        console.error('linkGuestToUser failed:', e)
      }
    }
    expireGuestAndPostLogoutCookies(res)
  }

  return res
}
