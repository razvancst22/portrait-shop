import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
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
      <CreateFlow category="pet" />
    </>
  )
}
