import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'

const DEFAULT_CLEANUP_HOURS = 24
const BATCH_SIZE = 100

function isStoragePath(str: string | null): boolean {
  return typeof str === 'string' && str.startsWith('uploads/')
}

function collectStoragePaths(
  gen: {
    id: string
    original_image_url: string | null
    final_image_url: string | null
    upscaled_image_url: string | null
    preview_image_url: string | null
    reference_image_urls?: unknown
  }
): string[] {
  const paths: string[] = []

  if (gen.preview_image_url && gen.preview_image_url.startsWith('previews/')) {
    paths.push(gen.preview_image_url)
  }
  if (gen.final_image_url && gen.final_image_url.startsWith('generations/')) {
    paths.push(gen.final_image_url)
  }
  if (gen.upscaled_image_url && gen.upscaled_image_url.startsWith('generations/') && gen.upscaled_image_url !== gen.final_image_url) {
    paths.push(gen.upscaled_image_url)
  }
  if (isStoragePath(gen.original_image_url)) {
    paths.push(gen.original_image_url!)
  }
  if (Array.isArray(gen.reference_image_urls)) {
    for (const item of gen.reference_image_urls) {
      if (typeof item === 'string' && isStoragePath(item)) {
        paths.push(item)
      }
    }
  }

  return [...new Set(paths)]
}

/**
 * Cron: DELETE unpurchased generations from GUEST users only, after 1 day.
 * Guest = session_id not in auth.users. Logged-in users keep 7-day retention (see cleanup-unpurchased).
 * Call with: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cleanupHours = parseInt(process.env.CLEANUP_GUEST_UNPURCHASED_HOURS || '', 10) || DEFAULT_CLEANUP_HOURS
  const olderThan = new Date(Date.now() - cleanupHours * 60 * 60 * 1000).toISOString()

  const supabase = createClient()

  // Get guest generation IDs via RPC (session_id not in auth.users)
  const { data: ids, error: rpcError } = await supabase.rpc('get_guest_unpurchased_generation_ids', {
    older_than: olderThan,
  })

  if (rpcError) {
    // If function doesn't exist yet (migration not applied), return gracefully
    if (rpcError.code === '42883' || rpcError.message?.includes('function')) {
      return NextResponse.json({ deleted: 0, message: 'Function not found. Run migration 00016.' })
    }
    console.error('cleanup-guest-unpurchased: RPC failed', rpcError)
    return NextResponse.json({ error: 'RPC failed', details: rpcError.message }, { status: 500 })
  }

  const idList = (ids ?? []).map((r: { id: string }) => r.id).filter(Boolean)
  if (idList.length === 0) {
    return NextResponse.json({ deleted: 0, message: 'No old guest unpurchased generations' })
  }

  // Fetch full rows for storage path collection
  const { data: generations, error: queryError } = await supabase
    .from('generations')
    .select('id, original_image_url, final_image_url, upscaled_image_url, preview_image_url, reference_image_urls')
    .in('id', idList)

  if (queryError || !generations?.length) {
    return NextResponse.json({ deleted: 0, message: 'No generations to delete' })
  }

  const allPaths: string[] = []
  for (const gen of generations) {
    allPaths.push(...collectStoragePaths(gen))
  }
  const uniquePaths = [...new Set(allPaths)]

  let storageDeleted = 0
  for (let i = 0; i < uniquePaths.length; i += BATCH_SIZE) {
    const batch = uniquePaths.slice(i, i + BATCH_SIZE)
    const { error: storageError } = await supabase.storage.from(BUCKET_UPLOADS).remove(batch)
    if (storageError) {
      console.error('cleanup-guest-unpurchased: storage delete failed', storageError)
    } else {
      storageDeleted += batch.length
    }
  }

  const { error: deleteError } = await supabase.from('generations').delete().in('id', idList)

  if (deleteError) {
    console.error('cleanup-guest-unpurchased: db delete failed', deleteError)
    return NextResponse.json(
      { error: 'DB delete failed', storageDeleted, details: deleteError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    deleted: idList.length,
    storageFilesDeleted: storageDeleted,
    cleanupHours,
  })
}
