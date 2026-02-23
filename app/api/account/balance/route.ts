import { NextResponse } from 'next/server'
import { createClientIfConfigured } from '@/lib/supabase/server'
import { getOptionalUser } from '@/lib/supabase/auth-server'
import { getUserBalance } from '@/lib/tokens/user-tokens'
import { getPackBalance } from '@/lib/pack-credits'
import { isDevUser, DEV_USER_CREDITS } from '@/lib/tokens/constants'

/**
 * GET /api/account/balance – breakdown of credits for logged-in user.
 * Returns free generations, pack generations, and pack downloads.
 * Dev users (DEV_USER_EMAIL) get DEV_USER_CREDITS.
 */
export async function GET() {
  const user = await getOptionalUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  }

  if (isDevUser(user.email)) {
    return NextResponse.json(
      {
        freeGenerationsRemaining: DEV_USER_CREDITS,
        packGenerationsRemaining: 0,
        packDownloadsRemaining: 0,
        totalCredits: DEV_USER_CREDITS,
        packTypes: [],
      },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    )
  }

  const supabase = createClientIfConfigured()
  if (!supabase) {
    return NextResponse.json({
      freeGenerationsRemaining: 0,
      packGenerationsRemaining: 0,
      packDownloadsRemaining: 0,
      totalCredits: 0,
      packTypes: [],
    })
  }

  try {
    const [userResult, packResult] = await Promise.all([
      getUserBalance(supabase, user.id),
      getPackBalance(supabase, user.id),
    ])

    const freeRemaining = userResult.balance
    const packGenRemaining = packResult.generationsRemaining
    const packDownRemaining = packResult.downloadsRemaining
    const totalCredits = freeRemaining + packGenRemaining

    return NextResponse.json(
      {
        freeGenerationsRemaining: freeRemaining,
        packGenerationsRemaining: packGenRemaining,
        packDownloadsRemaining: packDownRemaining,
        totalCredits,
        packTypes: packResult.packTypes,
      },
      { headers: { 'Cache-Control': 'no-store, must-revalidate' } }
    )
  } catch {
    return NextResponse.json({
      freeGenerationsRemaining: 0,
      packGenerationsRemaining: 0,
      packDownloadsRemaining: 0,
      totalCredits: 0,
      packTypes: [],
    })
  }
}
