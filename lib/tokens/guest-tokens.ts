import type { SupabaseClient } from '@supabase/supabase-js'
import { GUEST_TOKENS_INITIAL } from './constants'
import { isDevGuest, DEV_CREDITS_BALANCE } from './constants'

export type GuestBalanceResult = {
  balance: number
  isNewGuest: boolean
}

/**
 * Get current token balance for a guest. If no row exists, balance = GUEST_TOKENS_INITIAL.
 * Dev guest (DEV_GUEST_ID) always gets unlimited balance.
 */
export async function getGuestBalance(
  supabase: SupabaseClient,
  guestId: string
): Promise<{ balance: number; tokensUsed: number }> {
  if (isDevGuest(guestId)) {
    return { balance: DEV_CREDITS_BALANCE, tokensUsed: 0 }
  }

  const { data } = await supabase
    .from('guest_token_usage')
    .select('tokens_used')
    .eq('guest_id', guestId)
    .single()

  const tokensUsed = data?.tokens_used ?? 0
  const balance = Math.max(0, GUEST_TOKENS_INITIAL - tokensUsed)
  return { balance, tokensUsed }
}

/**
 * Deduct one token for the guest. Returns true if deduction succeeded (had balance), false otherwise.
 * Creates row if not exists (first use).
 * Dev guest (DEV_GUEST_ID) never deducts; always returns true.
 */
export async function deductGuestToken(
  supabase: SupabaseClient,
  guestId: string
): Promise<boolean> {
  if (isDevGuest(guestId)) return true

  // Upsert: insert with tokens_used=1 if missing, or update tokens_used = tokens_used + 1 where tokens_used < 2
  const { data: existing } = await supabase
    .from('guest_token_usage')
    .select('tokens_used')
    .eq('guest_id', guestId)
    .single()

  if (!existing) {
    const { error: insertErr } = await supabase.from('guest_token_usage').insert({
      guest_id: guestId,
      tokens_used: 1,
    })
    return !insertErr
  }

  if (existing.tokens_used >= GUEST_TOKENS_INITIAL) {
    return false
  }

  const { error: updateErr } = await supabase
    .from('guest_token_usage')
    .update({ tokens_used: existing.tokens_used + 1 })
    .eq('guest_id', guestId)
    .eq('tokens_used', existing.tokens_used)

  return !updateErr
}
