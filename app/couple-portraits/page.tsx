import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategorySeoBlock } from '@/components/category-seo-block'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'Couple Portraits in Classic Art Styles | petportrait.shop',
  description:
    'Turn your couple photo into a Renaissance or Baroque double portrait. AI-generated couple portraits. Free preview, one fixed price for your digital bundle.',
  openGraph: {
    title: 'Couple Portraits in Classic Art Styles | petportrait.shop',
    description: 'Turn your couple photo into a Renaissance or Baroque double portrait. AI-generated couple portraits.',
    url: '/couple-portraits',
  },
}

export default function CouplePortraitsPage() {
  return (
    <>
      <CategoryJsonLd category="couple" />
      <CategorySeoBlock
        category="couple"
        intro="Create a timeless double portrait of you and your partner. Upload a photo and we'll transform it into a romantic, period-style couple portrait."
        benefits={[
          'Renaissance, Baroque, Victorian, Royal Court, and Belle Époque styles',
          'Free watermarked preview before you buy',
          'One fixed price for your digital bundle',
        ]}
      />
      <CreateFlow category="couple" />
    </>
  )
}
