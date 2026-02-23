import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'AI Self Portraits – Become Art in Renaissance & Victorian Style',
  description:
    'Transform your photo into a museum-worthy Renaissance, Baroque, or Victorian self-portrait. See your preview in minutes • Stand out on social media.',
  openGraph: {
    title: 'AI Self Portraits – Become Art in Renaissance & Victorian Style',
    description:
      'Transform your photo into a museum-worthy Renaissance, Baroque, or Victorian self-portrait. See your preview in minutes.',
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
