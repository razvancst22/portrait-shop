import OpenAI from 'openai'
import { toFile } from 'openai/uploads'
import { validateUrlForFetch, getAllowedImageDomains } from '@/lib/url-validator'

const MODEL = 'gpt-image-1.5'

async function fetchAndToFile(
  url: string,
  allowedDomains: string[],
  filename: string
): Promise<{ file: Awaited<ReturnType<typeof toFile>> }> {
  const validation = validateUrlForFetch(url, allowedDomains)
  if (!validation.valid) {
    throw new Error(`Invalid reference image URL: ${validation.error}`)
  }
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch reference image: ${response.status}`)
  }
  const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  const mime =
    contentType && /^image\/(png|jpeg|jpg|webp)$/.test(contentType) ? contentType : 'image/png'
  const ext = mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png'
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const file = await toFile(buffer, `${filename}.${ext}`, { type: mime })
  return { file }
}

/**
 * Generate a portrait from reference image(s) + prompt using OpenAI Images Edit API.
 * Supports 1-16 reference images (e.g. family portraits with multiple photos).
 * Size and aspect (e.g. 4:5) come from the prompt text in artStyles.ts only.
 *
 * @param referenceImageUrls - Single URL or array of 2-6 URLs (ordered: person 1, 2, 3...)
 * @param prompt - Full prompt; for multi-image, prompt should reference "Image 1", "Image 2", etc.
 * @param inputFidelity - Use 'high' for family/couple to preserve facial likeness
 */
export async function generatePortraitFromReference(
  referenceImageUrls: string | string[],
  prompt: string,
  options?: { inputFidelity?: 'high' | 'low' }
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  const urls = Array.isArray(referenceImageUrls) ? referenceImageUrls : [referenceImageUrls]
  if (urls.length === 0) {
    throw new Error('At least one reference image URL is required')
  }
  if (urls.length > 16) {
    throw new Error('Maximum 16 reference images supported')
  }

  const allowedDomains = getAllowedImageDomains()

  const files = await Promise.all(
    urls.map((url, i) => fetchAndToFile(url, allowedDomains, `reference-${i + 1}`))
  )

  const imageParam: Awaited<ReturnType<typeof toFile>> | Awaited<ReturnType<typeof toFile>>[] =
    files.length === 1 ? files[0].file : files.map((f) => f.file)

  const openai = new OpenAI({ apiKey })
  const result = await openai.images.edit({
    model: MODEL,
    image: imageParam,
    prompt,
    quality: 'low',
    input_fidelity: options?.inputFidelity ?? (urls.length > 1 ? 'high' : 'low'),
  })

  const b64 = result.data?.[0]?.b64_json
  if (!b64) {
    throw new Error('No image data in GPT Image response')
  }
  return Buffer.from(b64, 'base64')
}
