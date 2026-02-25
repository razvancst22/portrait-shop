import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'
import { createClient } from '@/lib/supabase/server'
import { BUCKET_UPLOADS } from '@/lib/constants'

/** Preview output is always 4:5 aspect ratio. */
const PREVIEW_WIDTH = 1080
const PREVIEW_HEIGHT = 1350 // 4:5

/** Dense grid for full photo coverage - edge-to-edge, no margins. */
const COLS = 8
const ROWS = 10

const WATERMARK_TEXT = 'Portrait'
const LOGO_FILENAME = 'Portraitz_white.png'

/**
 * Download image from URL, resize to 4:5, apply watermark across the entire photo
 * (edge-to-edge, full coverage), return JPEG buffer.
 * Uses logo watermark when available; falls back to dense text grid.
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

  const logoPath = path.join(process.cwd(), 'public', LOGO_FILENAME)
  const logoExists = fs.existsSync(logoPath)

  if (logoExists) {
    return addLogoWatermark(resized, width, height, logoPath)
  }

  return addTextWatermark(resized, width, height)
}

/**
 * Apply logo watermark in a dense grid, edge-to-edge covering the entire image.
 */
async function addLogoWatermark(
  resized: Buffer,
  width: number,
  height: number,
  logoPath: string
): Promise<Buffer> {
  const cellW = width / COLS
  const cellH = height / ROWS
  // Logo slightly larger than cell (105%) for overlap and full coverage
  const logoSize = Math.ceil(Math.max(cellW, cellH) * 1.05)

  const logoBuffer = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .linear([1, 1, 1, 0.45], [0, 0, 0, 0]) // scale alpha to 45% opacity
    .png()
    .toBuffer()

  const composite: { input: Buffer; left: number; top: number }[] = []

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      composite.push({
        input: logoBuffer,
        left: Math.round(col * cellW),
        top: Math.round(row * cellH),
      })
    }
  }

  const watermarked = await sharp(resized)
    .composite(composite)
    .jpeg({ quality: 85 })
    .toBuffer()

  return watermarked
}

/**
 * Apply text watermark in a dense grid, edge-to-edge covering the entire image.
 * Fallback when logo is not available.
 */
async function addTextWatermark(
  resized: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const cellW = width / COLS
  const cellH = height / ROWS
  const fontSize = Math.min(Math.floor(cellW / 2), Math.floor(cellH / 2), 72)
  const textOpacity = 0.52
  const strokeOpacity = 0.35

  const textElements: string[] = []
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = col * cellW + cellW / 2
      const y = row * cellH + cellH / 2
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
  const storagePath = `previews/${generationId}.jpg`
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(BUCKET_UPLOADS)
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw new Error(`Watermark upload failed: ${error.message}`)
  return storagePath
}
