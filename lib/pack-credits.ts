/**
 * Pack credits: generations and downloads from Digital Pack purchases.
 * Used after free tokens are exhausted.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { DIGITAL_PACKS } from '@/lib/pricing/constants'
import type { DigitalPackId } from '@/lib/pricing/constants'

export type PackBalance = {
  generationsRemaining: number
  downloadsRemaining: number
  packTypes: DigitalPackId[]
}

/**
 * Get total pack credit balance for a user (sum across all pack purchases).
 */
export async function getPackBalance(supabase: SupabaseClient, userId: string): Promise<PackBalance> {
  const { data: purchases } = await supabase
    .from('pack_purchases')
    .select('pack_type, generations_granted, generations_used, downloads_granted, downloads_used')
    .eq('user_id', userId)

  let generationsRemaining = 0
  let downloadsRemaining = 0
  const packTypes: DigitalPackId[] = []

  for (const p of purchases ?? []) {
    const packType = p.pack_type as DigitalPackId
    if (packType && (packType === 'starter' || packType === 'creator' || packType === 'artist')) {
      packTypes.push(packType)
      generationsRemaining += (p.generations_granted ?? 0) - (p.generations_used ?? 0)
      downloadsRemaining += (p.downloads_granted ?? 0) - (p.downloads_used ?? 0)
    }
  }

  return { generationsRemaining: Math.max(0, generationsRemaining), downloadsRemaining: Math.max(0, downloadsRemaining), packTypes }
}

/**
 * Deduct 1 generation from pack balance. Uses first available pack (FIFO by created_at).
 * Returns true if deducted, false if insufficient.
 */
export async function deductPackGeneration(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: purchases } = await supabase
    .from('pack_purchases')
    .select('id, generations_granted, generations_used')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  const purchase = (purchases ?? []).find(
    (p) => (p.generations_granted ?? 0) - (p.generations_used ?? 0) > 0
  )
  if (!purchase) return false

  const used = (purchase.generations_used ?? 0) + 1
  if (used > (purchase.generations_granted ?? 0)) return false

  const { error } = await supabase
    .from('pack_purchases')
    .update({ generations_used: used })
    .eq('id', purchase.id)

  return !error
}

/**
 * Deduct 1 download from pack balance. Uses first available pack (FIFO).
 */
export async function deductPackDownload(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data: all } = await supabase
    .from('pack_purchases')
    .select('id, downloads_granted, downloads_used')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  const withRemaining = (all ?? []).find((p) => (p.downloads_granted ?? 0) - (p.downloads_used ?? 0) > 0)
  if (!withRemaining) return false

  const used = (withRemaining.downloads_used ?? 0) + 1
  const { error } = await supabase
    .from('pack_purchases')
    .update({ downloads_used: used })
    .eq('id', withRemaining.id)

  return !error
}

/**
 * Create pack purchase record when Stripe webhook confirms payment.
 */
export async function createPackPurchase(
  supabase: SupabaseClient,
  orderId: string,
  userId: string,
  packType: DigitalPackId
): Promise<void> {
  const config = DIGITAL_PACKS[packType]
  if (!config) return

  await supabase.from('pack_purchases').insert({
    order_id: orderId,
    user_id: userId,
    pack_type: packType,
    generations_granted: config.generations,
    generations_used: 0,
    downloads_granted: config.highResDownloads,
    downloads_used: 0,
  })
}
