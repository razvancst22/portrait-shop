import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { MyPortraitsSection } from '@/components/home/my-portraits-section'
import { GallerySection } from '@/components/gallery-section'
import { CategoryJsonLd } from '@/components/category-json-ld'
import { CategoryPageHeader } from '@/components/category-page-header'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

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
      <div className="flex flex-col items-center px-4 pt-6 md:pt-10 pb-8 md:pb-12">
        <main className="max-w-3xl w-full text-center">
          <CategoryPageHeader category="dog" />
          <CreateFlow category="dog" />
          <MyPortraitsSection />
          <GallerySection items={getGalleryImagesForPage('dog', false)} />
        </main>
      </div>
    </>
  )
}
