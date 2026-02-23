import OpenAI from 'openai'
import { toFile } from 'openai/uploads'
import { validateUrlForFetch, getAllowedImageDomains } from '@/lib/url-validator'

const MODEL = 'gpt-image-1.5'

/**
 * Generate a portrait from a reference image + prompt using OpenAI Images Edit API.
 * Size and aspect (e.g. 4:5) come from the prompt text in artStyles.ts only; no size/quality overrides.
 */
export async function generatePortraitFromReference(
  referenceImageUrl: string,
  prompt: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  // Validate URL to prevent SSRF attacks
  const allowedDomains = getAllowedImageDomains()
  const validation = validateUrlForFetch(referenceImageUrl, allowedDomains)
  if (!validation.valid) {
    throw new Error(`Invalid reference image URL: ${validation.error}`)
  }

  const response = await fetch(referenceImageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch reference image: ${response.status}`)
  }
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  const mime =
    contentType && /^image\/(png|jpeg|jpg|webp)$/.test(contentType) ? contentType : 'image/png'
  const ext = mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const file = await toFile(buffer, `reference.${ext}`, { type: mime })

  const openai = new OpenAI({ apiKey })
  const result = await openai.images.edit({
    model: MODEL,
    image: file,
    prompt,
    quality: 'low',
  })

  const b64 = result.data?.[0]?.b64_json
  if (!b64) {
    throw new Error('No image data in GPT Image response')
  }
  return Buffer.from(b64, 'base64')
}
