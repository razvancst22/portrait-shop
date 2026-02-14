import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategorySeoBlock } from '@/components/category-seo-block'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'Children Portraits in Classic Art Styles | petportrait.shop',
  description:
    'Turn your child\'s photo into a Renaissance or Victorian portrait. AI-generated children portraits. Free preview, one fixed price for your digital bundle.',
  openGraph: {
    title: 'Children Portraits in Classic Art Styles | petportrait.shop',
    description: 'Turn your child\'s photo into a Renaissance or Victorian portrait. AI-generated children portraits.',
    url: '/children-portraits',
  },
}

export default function ChildrenPortraitsPage() {
  return (
    <>
      <CategoryJsonLd category="children" />
      <CategorySeoBlock
        category="children"
        intro="Capture your child in a classic portrait. Upload a photo and we'll create a refined, period-style portrait—Renaissance, Victorian, or Royal Court—perfect for a keepsake."
        benefits={[
          'Child-appropriate classic styles: Renaissance, Baroque, Victorian, Royal Court, Belle Époque',
          'Free watermarked preview before you buy',
          'One fixed price for your digital bundle',
        ]}
      />
      <CreateFlow category="children" />
    </>
  )
}
