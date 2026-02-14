import { NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/auth-server'

/**
 * Auth callback: exchange code for session (e.g. after email confirmation or OAuth).
 * Redirects to /account on success, /login on error.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'

  if (code) {
    const supabase = await createAuthClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`)
}
