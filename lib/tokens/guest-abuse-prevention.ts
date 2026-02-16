import { createHmac } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { GUEST_TOKENS_INITIAL } from './constants'

const WINDOW_DAYS = 30
const TABLE = 'free_generation_usage'

function getSecret(): string {
  const secret = process.env.ABUSE_PREVENTION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('ABUSE_PREVENTION_SECRET or SUPABASE_SERVICE_ROLE_KEY required for abuse prevention')
  }
  return secret ?? 'dev-secret-change-me'
}

function hash(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

/**
 * Hash IP so we don't store raw IPs. Same IP + secret => same hash.
 */
export function hashIp(ip: string): string {
  if (!ip || ip === 'unknown') return ''
  return hash(ip.trim())
}

/**
 * Hash device hint (User-Agent + Accept-Language) for "per device" cap. Same browser => same key.
 */
export function hashDevice(userAgent: string | null, acceptLanguage: string | null): string | null {
  const ua = (userAgent ?? '').trim()
  const lang = (acceptLanguage ?? '').trim()
  if (!ua && !lang) return null
  return hash(`device:${ua}:${lang}`)
}

/**
 * Count free generations in the last 30 days for this IP and for this device.
 */
export async function getFreeUsageCountsInWindow(
  supabase: SupabaseClient,
  ipHash: string,
  deviceKey: string | null
): Promise<{ byIp: number; byDevice: number }> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  let byIp = 0
  let byDevice = 0

  if (ipHash) {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('used_at', since)
    if (!error && count != null) byIp = count
  }

  if (deviceKey) {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('device_key', deviceKey)
      .gte('used_at', since)
    if (!error && count != null) byDevice = count
  }

  return { byIp, byDevice }
}

/**
 * Record one free generation use (call after successfully deducting a guest token).
 */
export async function recordFreeGenerationUse(
  supabase: SupabaseClient,
  ipHash: string,
  deviceKey: string | null
): Promise<void> {
  if (!ipHash) return
  await supabase.from(TABLE).insert({
    ip_hash: ipHash,
    device_key: deviceKey,
    used_at: new Date().toISOString(),
  })
}

/**
 * Record free use from request-derived values (hashes inside). Call after a successful generate.
 */
export async function recordFreeGenerationUseFromRequest(
  supabase: SupabaseClient,
  ip: string,
  userAgent: string | null,
  acceptLanguage: string | null
): Promise<void> {
  const ipHash = hashIp(ip)
  const deviceKey = hashDevice(userAgent, acceptLanguage)
  await recordFreeGenerationUse(supabase, ipHash, deviceKey)
}

/**
 * Returns true if this IP and device are both under the 30-day cap (GUEST_TOKENS_INITIAL free per window).
 */
export async function canUseFreeGeneration(
  supabase: SupabaseClient,
  ip: string,
  userAgent: string | null,
  acceptLanguage: string | null
): Promise<boolean> {
  const ipHash = hashIp(ip)
  const deviceKey = hashDevice(userAgent, acceptLanguage)
  if (!ipHash) return true // e.g. unknown IP in dev; allow and don't record

  const { byIp, byDevice } = await getFreeUsageCountsInWindow(supabase, ipHash, deviceKey)
  if (byIp >= GUEST_TOKENS_INITIAL) return false
  if (deviceKey != null && byDevice >= GUEST_TOKENS_INITIAL) return false
  return true
}
