import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  isAllowedArtStyle,
  isAllowedPetType,
  isAllowedSubjectType,
  buildPrompt,
  type ArtStyleId,
  type PetTypeId,
  type SubjectTypeId,
} from '@/lib/prompts/artStyles'
import { startGeneration } from '@/lib/ai/midjourney'
import { checkJsonBodySize } from '@/lib/api-limits'

/**
 * POST /api/generate – create generations row and start AI job (or stub).
 * Body: { imageUrl, artStyle, subjectType, petType? }
 * subjectType: pet | family | children | couple | self
 * Returns: { generationId, jobId? }
 */
export async function POST(request: NextRequest) {
  const sizeError = checkJsonBodySize(request)
  if (sizeError) return sizeError
  try {
    const body = await request.json()
    const { imageUrl, artStyle, subjectType, petType } = body as {
      imageUrl?: string
      artStyle?: string
      subjectType?: string
      petType?: string
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageUrl' },
        { status: 400 }
      )
    }
    if (!isAllowedArtStyle(artStyle ?? '')) {
      return NextResponse.json(
        { error: 'Invalid artStyle. Allowed: renaissance, baroque, victorian, regal, belle_epoque' },
        { status: 400 }
      )
    }
    const resolvedSubjectType: SubjectTypeId = isAllowedSubjectType(subjectType ?? 'pet')
      ? (subjectType as SubjectTypeId)
      : 'pet'
    const resolvedPetType =
      resolvedSubjectType === 'pet' && petType && isAllowedPetType(petType)
        ? (petType as PetTypeId)
        : undefined

    const prompt = buildPrompt(
      artStyle as ArtStyleId,
      resolvedSubjectType,
      resolvedPetType
    )

    const supabase = createClient()
    const sessionId = request.headers.get('x-session-id') ?? undefined

    const dbSubjectType =
      resolvedSubjectType === 'pet' && resolvedPetType
        ? `pet_${resolvedPetType}`
        : resolvedSubjectType

    const { data: gen, error: insertError } = await supabase
      .from('generations')
      .insert({
        session_id: sessionId ?? null,
        original_image_url: imageUrl,
        art_style: artStyle,
        subject_type: dbSubjectType,
        midjourney_prompt: prompt,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !gen) {
      console.error('Insert generation error:', insertError)
      return NextResponse.json(
        { error: insertError?.message ?? 'Failed to create generation' },
        { status: 500 }
      )
    }

    const { jobId, status } = await startGeneration({
      imageUrl,
      artStyle: artStyle as ArtStyleId,
      subjectType: resolvedSubjectType,
      petType: resolvedPetType,
    })

    await supabase
      .from('generations')
      .update({
        midjourney_job_id: jobId,
        status: status === 'generating' ? 'generating' : 'pending',
      })
      .eq('id', gen.id)

    return NextResponse.json({
      generationId: gen.id,
      jobId,
    })
  } catch (e) {
    console.error('Generate error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
