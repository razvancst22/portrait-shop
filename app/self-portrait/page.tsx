import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategorySeoBlock } from '@/components/category-seo-block'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'Self Portrait in Classic Art Styles | petportrait.shop',
  description:
    'Turn your photo into a Renaissance, Baroque, or Victorian self-portrait. AI-generated classic portraits. Free preview, one fixed price for your digital bundle.',
  openGraph: {
    title: 'Self Portrait in Classic Art Styles | petportrait.shop',
    description: 'Turn your photo into a Renaissance, Baroque, or Victorian self-portrait. AI-generated classic portraits.',
    url: '/self-portrait',
  },
}

export default function SelfPortraitPage() {
  return (
    <>
      <CategoryJsonLd category="self" />
      <CategorySeoBlock
        category="self"
        intro="See yourself as a classic masterpiece. Upload a photo and we'll create an elegant self-portrait in the style of the great masters—Renaissance, Baroque, Victorian, or Belle Époque."
        benefits={[
          'Renaissance, Baroque, Victorian, Royal Court, and Belle Époque styles',
          'Free watermarked preview before you buy',
          'One fixed price for your digital bundle',
        ]}
      />
      <CreateFlow category="self" />
    </>
  )
}
