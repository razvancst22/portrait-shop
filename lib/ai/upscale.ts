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
 * @param imageUrl - Public or signed URL of the image to upscale
 * @returns Buffer of the upscaled PNG, or null if not configured or on failure
 */
export async function upscaleImage(imageUrl: string): Promise<Buffer | null> {
  const token = process.env.REPLICATE_API_TOKEN?.trim()
  if (!token) {
    return null
  }

  try {
    const replicate = new Replicate({ auth: token })
    const output = await replicate.run(REAL_ESRGAN_MODEL, {
      input: {
        image: imageUrl,
        outscale: 2,
      },
      wait: { mode: 'block', timeout: 120_000 },
    })

    // Output is typically a URL string for image models
    const outputUrl = typeof output === 'string' ? output : Array.isArray(output) ? output[0] : (output as { url?: string })?.url
    if (!outputUrl || typeof outputUrl !== 'string') {
      console.error('Upscale API returned unexpected output:', output)
      return null
    }

    const res = await fetch(outputUrl)
    if (!res.ok) {
      throw new Error(`Failed to fetch upscaled image: ${res.status}`)
    }
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (e) {
    console.error('Upscale API error:', e)
    return null
  }
}
