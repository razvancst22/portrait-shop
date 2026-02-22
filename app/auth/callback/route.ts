import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAuthClient } from '@/lib/supabase/auth-server'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { linkGuestToUser } from '@/lib/auth/link-guest-to-user'
import { expireGuestAndPostLogoutCookies } from '@/lib/tokens/guest-tokens-cookie'
import { GUEST_ID_COOKIE } from '@/lib/tokens/constants'

/**
 * Auth callback: exchange code for session (e.g. after email confirmation or OAuth).
 * If guest_id cookie exists, link guest generations and token usage to the new user.
 * Redirects to /account on success, /login on error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'

  if (code) {
    const supabaseAuth = await createAuthClient()
    const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const redirectUrl = `${origin}${next}`
      const res = NextResponse.redirect(redirectUrl)

      const cookieStore = await cookies()
      const guestId = cookieStore.get(GUEST_ID_COOKIE)?.value

      if (guestId) {
        const supabase = createClientIfConfigured()
        if (supabase) {
          try {
            await linkGuestToUser(supabase, data.user.id, guestId)
          } catch (e) {
            console.error('linkGuestToUser failed:', e)
          }
        }
        expireGuestAndPostLogoutCookies(res)
      }

      return res
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
