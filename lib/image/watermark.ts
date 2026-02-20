import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'

/** Preview output is always 4:5 aspect ratio. */
const PREVIEW_WIDTH = 1080
const PREVIEW_HEIGHT = 1350 // 4:5

const WATERMARK_TEXT = 'Portrait'

/**
 * Download image from URL, resize to 4:5, apply uniform repeated watermark, return JPEG buffer.
 * Watermark is tiled in rows and columns across the whole image so it covers the photo uniformly
 * without a single harsh block.
 */
export async function addWatermark(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }
  const imageBuffer = Buffer.from(await response.arrayBuffer())

  // Resize/crop to exactly 4:5 (center crop)
  const resized = await sharp(imageBuffer)
    .resize(PREVIEW_WIDTH, PREVIEW_HEIGHT, {
      fit: 'cover',
      position: 'center',
    })
    .toBuffer()

  const width = PREVIEW_WIDTH
  const height = PREVIEW_HEIGHT

  // Grid: uniform rows and columns so watermark appears everywhere but stays readable
  const cols = 4
  const rows = 5
  const stepX = width / (cols + 1)
  const stepY = height / (rows + 1)
  const fontSize = Math.min(Math.floor(width / 16), Math.floor(height / 20))
  const textOpacity = 0.52
  const strokeOpacity = 0.35

  const textElements: string[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = stepX * (col + 1)
      const y = stepY * (row + 1)
      textElements.push(
        `<text
          x="${x}" y="${y}"
          text-anchor="middle" dominant-baseline="middle"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          font-weight="700"
          fill="white" opacity="${textOpacity}"
          stroke="black" stroke-width="2" stroke-opacity="${strokeOpacity}"
          transform="rotate(-30 ${x} ${y})"
        >${WATERMARK_TEXT}</text>`
      )
    }
  }

  const watermarkSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="black" opacity="0.04"/>
      ${textElements.join('\n      ')}
    </svg>
  `

  const watermarked = await sharp(resized)
    .composite([
      {
        input: Buffer.from(watermarkSvg),
        top: 0,
        left: 0,
      },
    ])
    .jpeg({ quality: 85 })
    .toBuffer()

  return watermarked
}

/**
 * Create watermarked image from final URL, upload to Storage, return storage path.
 * Store this path in generations.preview_image_url; status API will serve a signed URL for it.
 */
export async function createAndUploadWatermark(
  finalImageUrl: string,
  generationId: string
): Promise<string> {
  const buffer = await addWatermark(finalImageUrl)
  const path = `previews/${generationId}.jpg`
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKET_UPLOADS)
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`Watermark upload failed: ${error.message}`)
  return path
}
