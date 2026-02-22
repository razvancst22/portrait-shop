import type { SupabaseClient } from '@supabase/supabase-js'
import { getGuestBalance } from '@/lib/tokens/guest-tokens'

/**
 * Link guest data to a new user account on signup.
 * - Migrate generations: session_id guest_id -> user.id
 * - Migrate token usage: create user_token_usage with same tokens_used as guest
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

  const { tokensUsed } = await getGuestBalance(supabase, guestId)

  if (tokensUsed > 0) {
    const { error } = await supabase.from('user_token_usage').upsert(
      {
        user_id: userId,
        tokens_used: tokensUsed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    tokensMigrated = !error
  }

  return { generationsLinked, tokensMigrated }
}
