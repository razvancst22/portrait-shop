import { buildPrompt } from '@/lib/prompts/artStyles'
import type { ArtStyleId, PetTypeId, SubjectTypeId } from '@/lib/prompts/artStyles'

const IMAGINE_API_URL = 'https://api.imagineapi.dev/v1'

export interface StartGenerationRequest {
  imageUrl: string
  artStyle: ArtStyleId
  subjectType: SubjectTypeId
  petType?: PetTypeId
}

export interface StartGenerationResult {
  jobId: string
  status: 'pending' | 'generating'
}

/**
 * Start image generation. Uses ImagineAPI when IMAGINE_API_KEY is set;
 * otherwise returns a stub jobId for testing (status polling will handle stub).
 */
export async function startGeneration(
  request: StartGenerationRequest
): Promise<StartGenerationResult> {
  const prompt = buildPrompt(
    request.artStyle,
    request.subjectType,
    request.petType
  )
  const fullPrompt = `${request.imageUrl} ${prompt}`

  const apiKey = process.env.IMAGINE_API_KEY
  if (!apiKey) {
    return { jobId: `stub-${Date.now()}`, status: 'generating' }
  }

  const response = await fetch(`${IMAGINE_API_URL}/imagine`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      aspect_ratio: '4:5',
      model: 'v7',
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`ImagineAPI error: ${response.status} ${text}`)
  }

  const data = (await response.json()) as { id?: string }
  const jobId = data?.id ?? `api-${Date.now()}`
  return { jobId, status: 'generating' }
}
