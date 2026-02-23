import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'AI Cat Portraits – Create Royal Renaissance & Victorian Cat Art',
  description:
    'Turn your cat into a royal Renaissance, Baroque, or Victorian masterpiece in minutes. Free preview • Museum-quality results • The perfect gift for cat lovers.',
  openGraph: {
    title: 'AI Cat Portraits – Create Royal Renaissance & Victorian Cat Art',
    description:
      'Turn your cat into a royal Renaissance, Baroque, or Victorian masterpiece in minutes. Free preview • Museum-quality results.',
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
