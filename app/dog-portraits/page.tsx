import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'Dog Portraits in Classic Art Styles | petportrait.shop',
  description:
    'Turn your dog into a Renaissance, Baroque, or Victorian masterpiece. AI-generated dog portraits. Free preview, one fixed price for your digital bundle.',
  openGraph: {
    title: 'Dog Portraits in Classic Art Styles | petportrait.shop',
    description:
      'Turn your dog into a Renaissance, Baroque, or Victorian masterpiece. AI-generated dog portraits.',
    url: '/dog-portraits',
  },
}

export default function DogPortraitsPage() {
  return (
    <>
      <CategoryJsonLd category="dog" />
      <CreateFlow category="dog" />
    </>
  )
}
