import type { SupabaseClient } from '@supabase/supabase-js'
import { getGuestBalance } from '@/lib/tokens/guest-tokens'

/**
 * Link guest data to a new user account on signup.
 * - Migrate generations: session_id guest_id -> user.id
 * - Migrate token usage: use MAX(guest tokens_used, user tokens_used) so we never
 *   overwrite a more-exhausted user with a less-exhausted guest (e.g. guest 1 used,
 *   user 2 used -> keep 2, not 1).
 * - Does not modify guest_token_usage (guest row can stay for audit)
 */
export async function linkGuestToUser(
  supabase: SupabaseClient,
  userId: string,
  guestId: string
): Promise<{ generationsLinked: number; tokensMigrated: boolean }> {
  let generationsLinked = 0
  let tokensMigrated = false

  const { data: updated } = await supabase
    .from('generations')
    .update({ session_id: userId, updated_at: new Date().toISOString() })
    .eq('session_id', guestId)
    .select('id')

  if (updated && Array.isArray(updated)) {
    generationsLinked = updated.length
  }

  const { tokensUsed: guestTokensUsed } = await getGuestBalance(supabase, guestId)

  const { data: existing } = await supabase
    .from('user_token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .maybeSingle()

  const existingTokensUsed = existing?.tokens_used ?? 0
  const tokensUsedToSet = Math.max(guestTokensUsed, existingTokensUsed)

  const { error } = await supabase.from('user_token_usage').upsert(
    {
      user_id: userId,
      tokens_used: tokensUsedToSet,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  tokensMigrated = !error

  return { generationsLinked, tokensMigrated }
}
