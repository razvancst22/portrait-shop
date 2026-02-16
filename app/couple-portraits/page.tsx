import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'Couple Portraits in Classic Art Styles | petportrait.shop',
  description:
    'Turn your couple photo into a Renaissance or Baroque double portrait. AI-generated couple portraits. Free preview, one fixed price for your digital bundle.',
  openGraph: {
    title: 'Couple Portraits in Classic Art Styles | petportrait.shop',
    description: 'Turn your couple photo into a Renaissance or Baroque double portrait. AI-generated couple portraits.',
    url: '/couple-portraits',
  },
}

export default function CouplePortraitsPage() {
  return (
    <>
      <CategoryJsonLd category="couple" />
      <CreateFlow category="couple" />
    </>
  )
}
