import { NextResponse } from 'next/server'
import { DIGITAL_BUNDLE_PRICE_USD } from '@/lib/constants'

/**
 * Phase 1: Fixed price for digital bundle. No pricing_strategy or country lookup.
 * GET /api/pricing returns { digitalBundlePrice: 10 }
 */
export async function GET() {
  return NextResponse.json({
    digitalBundlePrice: DIGITAL_BUNDLE_PRICE_USD,
  })
}
