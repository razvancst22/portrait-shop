import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'AI Family Portraits – Heirloom Renaissance & Victorian Group Art',
  description:
    'Create a timeless family heirloom from your photo in Renaissance, Baroque, or Victorian style. Free preview • Perfect for generations • One fixed price.',
  openGraph: {
    title: 'AI Family Portraits – Heirloom Renaissance & Victorian Group Art',
    description:
      'Create a timeless family heirloom from your photo in Renaissance, Baroque, or Victorian style. Free preview • One fixed price.',
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
