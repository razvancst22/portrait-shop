import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/generate/[id] – update generation (e.g. pet_name for email marketing).
 * Body: { petName?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let body: { petName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const petName =
    typeof body.petName === 'string' ? body.petName.trim().slice(0, 255) : null

  const supabase = createClient()
  const { error } = await supabase
    .from('generations')
    .update({ pet_name: petName || null })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
