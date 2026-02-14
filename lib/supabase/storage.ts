import { createClient } from './server'
import { BUCKET_UPLOADS, BUCKET_DELIVERABLES } from '@/lib/constants'

/**
 * Ensures Phase 1 Storage buckets exist. Call once during setup or from an API route.
 * Uses service role; create buckets in Dashboard if you prefer.
 */
export async function ensureStorageBuckets(): Promise<void> {
  const supabase = createClient()
  const buckets = [BUCKET_UPLOADS, BUCKET_DELIVERABLES]

  const { data: existing } = await supabase.storage.listBuckets()
  const names = new Set((existing ?? []).map((b) => b.name))

  for (const name of buckets) {
    if (names.has(name)) continue
    await supabase.storage.createBucket(name, { public: false })
  }
}

