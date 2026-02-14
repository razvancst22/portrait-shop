import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategorySeoBlock } from '@/components/category-seo-block'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'Pet Portraits in Classic Art Styles | petportrait.shop',
  description:
    'Turn your dog or cat into a Renaissance, Baroque, or Victorian masterpiece. AI-generated pet portraits. Free preview, one fixed price for your digital bundle.',
  openGraph: {
    title: 'Pet Portraits in Classic Art Styles | petportrait.shop',
    description:
      'Turn your dog or cat into a Renaissance, Baroque, or Victorian masterpiece. AI-generated pet portraits.',
    url: '/pet-portraits',
  },
}

export default function PetPortraitsPage() {
  return (
    <>
      <CategoryJsonLd category="pet" />
      <CategorySeoBlock
        category="pet"
        intro="Turn your pet into a timeless portrait in the style of the great masters. Upload a photo, choose an art style, and receive a high-resolution digital portrait—no re-generation, what you see is what you get."
        benefits={[
          'Multiple art styles: Renaissance, Baroque, Victorian, Royal Court, Belle Époque',
          'Free watermarked preview before you buy',
          'One fixed price for your digital bundle (4:5, 9:16, square, tablet)',
        ]}
      />
      <CreateFlow category="pet" />
    </>
  )
}
