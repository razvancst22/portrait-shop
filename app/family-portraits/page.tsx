import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategorySeoBlock } from '@/components/category-seo-block'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'Family Portraits in Classic Art Styles | petportrait.shop',
  description:
    'Turn your family photo into a Renaissance or Baroque group portrait. AI-generated family portraits. Free preview, one fixed price for your digital bundle.',
  openGraph: {
    title: 'Family Portraits in Classic Art Styles | petportrait.shop',
    description: 'Turn your family photo into a Renaissance or Baroque group portrait. AI-generated family portraits.',
    url: '/family-portraits',
  },
}

export default function FamilyPortraitsPage() {
  return (
    <>
      <CategoryJsonLd category="family" />
      <CategorySeoBlock
        category="family"
        intro="Bring your family together in a classic portrait. Upload a family photo and we'll transform it into a timeless group portrait in the style of the great masters."
        benefits={[
          'Renaissance, Baroque, Victorian, Royal Court, and Belle Époque styles',
          'Free watermarked preview before you buy',
          'One fixed price for your digital bundle',
        ]}
      />
      <CreateFlow category="family" />
    </>
  )
}
