import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { GallerySection } from '@/components/gallery-section'
import { CategoryJsonLd } from '@/components/category-json-ld'
import { CategoryPageHeader } from '@/components/category-page-header'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

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
      <div className="flex flex-col items-center px-4 pt-6 md:pt-10 pb-8 md:pb-12">
        <main className="max-w-3xl w-full text-center">
          <CategoryPageHeader category="family" />
          <CreateFlow category="family" />
          <GallerySection items={getGalleryImagesForPage('family', false)} />
        </main>
      </div>
    </>
  )
}
