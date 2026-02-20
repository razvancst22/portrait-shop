import { NextRequest, NextResponse } from 'next/server'
import { ART_STYLE_PROMPTS, ART_STYLE_IDS } from '@/lib/prompts/artStyles'
import { isAllowedSubjectType } from '@/lib/prompts/artStyles'

export type StyleListItem = {
  id: string
  name: string
  description: string
  /** URL for the style example image. Category-specific path when category provided; fallback to /style-examples/{id}.jpg */
  exampleImageUrl: string
  /** Color palette for UI display */
  colors: {
    primary: string    // Accent color unique to each style
    secondary: string  // Complementary color
    background: string // Background tone
  }
}

/**
 * GET /api/styles – returns preset styles for the style selector.
 * Query: ?category=pet|family|children|couple|self (optional). When set, exampleImageUrl uses
 * /style-examples/{category}_{id}.jpg (fallback: /style-examples/{id}.jpg if you don't add category-specific images).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const subjectType = category && isAllowedSubjectType(category) ? category : 'pet'

  const styles: StyleListItem[] = ART_STYLE_IDS.map((id) => {
    const s = ART_STYLE_PROMPTS[id]
    const exampleImageUrl =
      subjectType === 'pet' || subjectType === 'dog' || subjectType === 'cat'
        ? `/style-examples/${id}.jpg`
        : `/style-examples/${subjectType}_${id}.jpg`
    return {
      id,
      name: s.name,
      description: s.description,
      exampleImageUrl,
      colors: s.colors,
    }
  })
  return NextResponse.json(styles)
}
