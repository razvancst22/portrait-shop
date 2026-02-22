import type { SupabaseClient } from '@supabase/supabase-js'
import { GUEST_TOKENS_INITIAL } from './constants'

/**
 * Get current free token balance for a logged-in user.
 * If no row exists, balance = GUEST_TOKENS_INITIAL (2).
 */
export async function getUserBalance(
  supabase: SupabaseClient,
  userId: string
): Promise<{ balance: number; tokensUsed: number }> {
  const { data } = await supabase
    .from('user_token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .single()

  const tokensUsed = data?.tokens_used ?? 0
  const balance = Math.max(0, GUEST_TOKENS_INITIAL - tokensUsed)
  return { balance, tokensUsed }
}

/**
 * Deduct one token for the user. Returns true if deduction succeeded.
 */
export async function deductUserToken(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('user_token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    const { error: insertErr } = await supabase.from('user_token_usage').insert({
      user_id: userId,
      tokens_used: 1,
    })
    return !insertErr
  }

  if (existing.tokens_used >= GUEST_TOKENS_INITIAL) {
    return false
  }

  // Optimistic lock: update only if tokens_used still matches. Verify row was actually updated
  // to prevent race where two concurrent requests both read 0 and one gets false success.
  const { data: updated, error: updateErr } = await supabase
    .from('user_token_usage')
    .update({ tokens_used: existing.tokens_used + 1 })
    .eq('user_id', userId)
    .eq('tokens_used', existing.tokens_used)
    .select('id')

  return !updateErr && Array.isArray(updated) && updated.length === 1
}
