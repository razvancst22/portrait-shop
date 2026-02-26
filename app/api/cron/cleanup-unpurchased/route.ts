import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'

const DEFAULT_CLEANUP_DAYS = 7
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
 * Cron: DELETE unpurchased generations and their storage files after N days.
 * Purchased content (deliverables bucket) is never touched.
 * Call with: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cleanupDays = parseInt(process.env.CLEANUP_UNPURCHASED_DAYS || '', 10) || DEFAULT_CLEANUP_DAYS

  const supabase = createClient()

  const { data: generations, error: queryError } = await supabase
    .from('generations')
    .select('id, original_image_url, final_image_url, upscaled_image_url, preview_image_url, reference_image_urls')
    .eq('is_purchased', false)
    .lt('created_at', new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000).toISOString())

  if (queryError) {
    console.error('cleanup-unpurchased: query failed', queryError)
    return NextResponse.json({ error: 'Query failed', details: queryError.message }, { status: 500 })
  }

  if (!generations || generations.length === 0) {
    await supabase.from('free_generation_usage').delete().lt('used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    return NextResponse.json({ deleted: 0, message: 'No old unpurchased generations' })
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
      console.error('cleanup-unpurchased: storage delete failed', storageError)
    } else {
      storageDeleted += batch.length
    }
  }

  const ids = generations.map((g) => g.id)
  const { error: deleteError } = await supabase.from('generations').delete().in('id', ids)

  if (deleteError) {
    console.error('cleanup-unpurchased: db delete failed', deleteError)
    return NextResponse.json(
      { error: 'DB delete failed', storageDeleted, details: deleteError.message },
      { status: 500 }
    )
  }

  await supabase.from('free_generation_usage').delete().lt('used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  return NextResponse.json({
    deleted: ids.length,
    storageFilesDeleted: storageDeleted,
    cleanupDays,
  })
}
