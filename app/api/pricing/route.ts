import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  GET_YOUR_PORTRAIT_PRICE_USD,
  GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD,
  GET_YOUR_PORTRAIT_DISCOUNT_COUNTDOWN_MS,
  DIGITAL_PACKS,
  ART_PRINT_OPTIONS,
} from '@/lib/pricing/constants'

/**
 * GET /api/pricing
 * Query params: generationId? – if provided, returns discount eligibility for that generation
 * Returns: all product prices + optional discount info for Get your Portrait
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const generationId = searchParams.get('generationId')

  const response: {
    getYourPortraitPrice: number
    getYourPortraitDiscountPrice: number
    discountActive?: boolean
    expiresAt?: number
    digitalPacks: typeof DIGITAL_PACKS
    artPrintOptions: typeof ART_PRINT_OPTIONS
    /** @deprecated Use getYourPortraitPrice */
    digitalBundlePrice?: number
  } = {
    getYourPortraitPrice: GET_YOUR_PORTRAIT_PRICE_USD,
    getYourPortraitDiscountPrice: GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD,
    digitalPacks: DIGITAL_PACKS,
    artPrintOptions: ART_PRINT_OPTIONS,
    digitalBundlePrice: GET_YOUR_PORTRAIT_PRICE_USD,
  }

  if (generationId) {
    try {
      const supabase = createClient()
      const { data: gen } = await supabase
        .from('generations')
        .select('completed_at, status')
        .eq('id', generationId)
        .single()

      if (gen?.status === 'completed' && gen.completed_at) {
        const completedAt = new Date(gen.completed_at).getTime()
        const now = Date.now()
        const elapsed = now - completedAt
        const discountActive = elapsed < GET_YOUR_PORTRAIT_DISCOUNT_COUNTDOWN_MS
        const expiresAt = completedAt + GET_YOUR_PORTRAIT_DISCOUNT_COUNTDOWN_MS

        response.discountActive = discountActive
        response.expiresAt = expiresAt
      }
    } catch {
      // Ignore - discount info optional
    }
  }

  return NextResponse.json(response)
}
