import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'AI Dog Portraits – Create Renaissance & Victorian Art From Your Dog Photo',
  description:
    'Transform your dog photo into a museum-worthy Renaissance, Baroque, or Victorian masterpiece in minutes. Free preview • High-resolution download • Perfect for gifts & keepsakes.',
  openGraph: {
    title: 'AI Dog Portraits – Create Renaissance & Victorian Art From Your Dog Photo',
    description:
      'Transform your dog photo into a museum-worthy Renaissance, Baroque, or Victorian masterpiece in minutes. Free preview • High-resolution download.',
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
