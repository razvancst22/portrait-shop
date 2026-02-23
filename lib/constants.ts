/**
 * Phase 1: Digital bundle only. No pricing_strategy table or country-based pricing.
 * pricing_strategy will be introduced in Phase 2 with Artelo (shipping / physical products).
 * @deprecated Use GET_YOUR_PORTRAIT_PRICE_USD from lib/pricing/constants for Get your Portrait.
 */
export const DIGITAL_BUNDLE_PRICE_USD = 10

/** Supabase Storage bucket names (create these in Dashboard or via ensureBuckets) */
export const BUCKET_UPLOADS = 'uploads'
export const BUCKET_DELIVERABLES = 'deliverables'
