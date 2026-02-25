/**
 * Client-side image compression to stay under Vercel's 4.5 MB request body limit.
 * Mobile cameras often produce 8–15 MB photos; this compresses them before upload.
 */

const VERCEL_BODY_LIMIT_BYTES = 4 * 1024 * 1024 // 4 MB (safety margin under 4.5 MB)
const MAX_DIMENSION_PX = 2048
const INITIAL_QUALITY = 0.85
const MIN_QUALITY = 0.5

export type CompressResult = {
  file: File
  wasCompressed: boolean
}

/**
 * Compress an image file to stay under Vercel's body limit.
 * Uses Canvas API - no extra dependencies.
 * Returns original file if already small enough, otherwise a compressed JPEG.
 */
export async function compressImageForUpload(file: File): Promise<CompressResult> {
  if (file.size <= VERCEL_BODY_LIMIT_BYTES) {
    return { file, wasCompressed: false }
  }

  const img = await loadImage(file)
  const { width, height } = img
  const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d context not available')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  let quality = INITIAL_QUALITY
  let blob: Blob
  let attempts = 0
  const maxAttempts = 6

  do {
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        quality
      )
    })
    if (blob.size <= VERCEL_BODY_LIMIT_BYTES) break
    quality = Math.max(MIN_QUALITY, quality - 0.15)
    attempts++
  } while (attempts < maxAttempts && quality >= MIN_QUALITY)

  const baseName = file.name.replace(/\.[^.]+$/, '')
  const compressedFile = new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })

  return { file: compressedFile, wasCompressed: true }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}
