import Replicate from 'replicate'

const REAL_ESRGAN_MODEL = 'nightmareai/real-esrgan'

/**
 * Check if the Replicate upscale API is configured.
 */
export function isUpscaleConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN?.trim())
}

/**
 * Upscale an image via Replicate Real-ESRGAN.
 * Pure upscaling only - no face enhancement or modifications.
 * @param imageUrl - Public or signed URL of the image to upscale
 * @param scale - Scale factor (2 or 4, default: 2)
 * @returns Buffer of the upscaled PNG, or null if not configured or on failure
 */
export async function upscaleImage(
  imageUrl: string, 
  scale: number = 2
): Promise<Buffer | null> {
  const token = process.env.REPLICATE_API_TOKEN?.trim()
  if (!token) {
    return null
  }

  try {
    const replicate = new Replicate({ auth: token })
    console.log('Upscaling image:', imageUrl, 'with scale:', scale)
    const output = await replicate.run(REAL_ESRGAN_MODEL, {
      input: {
        image: imageUrl,
        scale: scale,
        face_enhance: false,  // Explicitly disabled - pure upscale only
      },
    })

    console.log('Replicate output:', output)
    // Output is typically a URL string for image models
    const outputUrl = typeof output === 'string' ? output : Array.isArray(output) ? output[0] : (output as { url?: string })?.url
    if (!outputUrl || typeof outputUrl !== 'string') {
      console.error('Upscale API returned unexpected output:', output)
      return null
    }
    console.log('Upscaled image URL:', outputUrl)

    const res = await fetch(outputUrl)
    if (!res.ok) {
      throw new Error(`Failed to fetch upscaled image: ${res.status}`)
    }
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (e) {
    console.error('Upscale API error:', e)
    // Log more detailed error information
    if (e instanceof Error) {
      console.error('Error message:', e.message)
      console.error('Error stack:', e.stack)
    }
    return null
  }
}
