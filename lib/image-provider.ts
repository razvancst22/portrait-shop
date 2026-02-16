/**
 * Image generation provider selection.
 * Set IMAGE_PROVIDER=openai|imagine|stub for explicit config; otherwise we infer from keys.
 */

export type ImageProvider = 'openai' | 'imagine' | 'stub'

const ALLOWED: ImageProvider[] = ['openai', 'imagine', 'stub']

export function getImageProvider(): ImageProvider {
  const env = process.env.IMAGE_PROVIDER?.toLowerCase()
  if (env && (ALLOWED as string[]).includes(env)) {
    return env as ImageProvider
  }
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'imagine'
}

export function isOpenAIProvider(): boolean {
  return getImageProvider() === 'openai'
}
