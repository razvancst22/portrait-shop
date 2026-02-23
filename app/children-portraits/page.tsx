import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'AI Children Portraits – Little Prince & Princess Renaissance Art',
  description:
    'Transform your child photo into a beautiful Renaissance or Victorian portrait. See your preview instantly • Perfect keepsake for parents & grandparents.',
  openGraph: {
    title: 'AI Children Portraits – Little Prince & Princess Renaissance Art',
    description:
      'Transform your child photo into a beautiful Renaissance or Victorian portrait. See your preview instantly • Perfect keepsake.',
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
