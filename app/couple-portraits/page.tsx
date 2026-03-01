import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { GallerySection } from '@/components/gallery-section'
import { CategoryJsonLd } from '@/components/category-json-ld'
import { CategoryPageHeader } from '@/components/category-page-header'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

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
      <div className="flex flex-col items-center px-4 pt-6 md:pt-10 pb-8 md:pb-12">
        <main className="max-w-3xl w-full text-center">
          <CategoryPageHeader category="couple" />
          <CreateFlow category="couple" />
          <GallerySection items={getGalleryImagesForPage('couple', false)} />
        </main>
      </div>
    </>
  )
}
