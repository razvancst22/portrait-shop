/**
 * Pricing constants for all products.
 * Used by pricing page, checkout API, and pricing API.
 */

/** Get your Portrait - single portrait purchase (4K + no watermark) */
export const GET_YOUR_PORTRAIT_PRICE_USD = 14.99
export const GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD = 9.99
export const GET_YOUR_PORTRAIT_DISCOUNT_COUNTDOWN_MS = 60 * 60 * 1000 // 1 hour

/** Digital Packs - credit bundles */
export const DIGITAL_PACKS = {
  starter: {
    id: 'starter' as const,
    priceUsd: 19.99,
    generations: 5,
    highResDownloads: 1,
    pricePerArtwork: null,
    description: 'Starter Pack',
  },
  creator: {
    id: 'creator' as const,
    priceUsd: 49.99,
    generations: 20,
    highResDownloads: 10,
    pricePerArtwork: 4.99,
    description: 'Creator Pack',
  },
  artist: {
    id: 'artist' as const,
    priceUsd: 139.99,
    generations: 50,
    highResDownloads: 50,
    pricePerArtwork: 2.37,
    description: 'Artist Pack',
  },
} as const

export type DigitalPackId = keyof typeof DIGITAL_PACKS

/** Art Print Pack - physical print by size */
export const ART_PRINT_OPTIONS = [
  { dimensions: '8×10"', price: 89 },
  { dimensions: '12×16"', price: 119 },
  { dimensions: '18×24"', price: 199 },
  { dimensions: '24×36"', price: 299 },
] as const

export type ArtPrintDimensions = (typeof ART_PRINT_OPTIONS)[number]['dimensions']
