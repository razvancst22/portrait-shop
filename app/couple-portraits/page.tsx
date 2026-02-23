import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { CategoryJsonLd } from '@/components/category-json-ld'

export const metadata: Metadata = {
  title: 'AI Couple Portraits – Romantic Renaissance & Victorian Double Portraits',
  description:
    'Capture your love forever with a stunning Renaissance or Baroque double portrait. Upload your photo, get a free preview • Perfect anniversary & wedding gifts.',
  openGraph: {
    title: 'AI Couple Portraits – Romantic Renaissance & Victorian Double Portraits',
    description:
      'Capture your love forever with a stunning Renaissance or Baroque double portrait. Upload your photo, get a free preview.',
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
