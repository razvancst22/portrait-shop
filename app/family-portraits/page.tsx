import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
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
      <CreateFlow category="family" />
    </>
  )
}
