import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
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
      <CreateFlow category="children" />
    </>
  )
}
