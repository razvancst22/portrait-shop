import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'Cat Portraits in Classic Art Styles | petportrait.shop',
  description:
    'Turn your cat into a Renaissance, Baroque, or Victorian masterpiece. AI-generated cat portraits. Free preview, one fixed price for your digital bundle.',
  openGraph: {
    title: 'Cat Portraits in Classic Art Styles | petportrait.shop',
    description:
      'Turn your cat into a Renaissance, Baroque, or Victorian masterpiece. AI-generated cat portraits.',
    url: '/cat-portraits',
  },
}

export default function CatPortraitsPage() {
  return (
    <>
      <CategoryJsonLd category="cat" />
      <CreateFlow category="cat" />
    </>
  )
}
