import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
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
      <CreateFlow category="self" />
    </>
  )
}
