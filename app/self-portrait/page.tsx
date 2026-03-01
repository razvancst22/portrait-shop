import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { MyPortraitsSection } from '@/components/home/my-portraits-section'
import { GallerySection } from '@/components/gallery-section'
import { CategoryJsonLd } from '@/components/category-json-ld'
import { CategoryPageHeader } from '@/components/category-page-header'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

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
      <div className="flex flex-col items-center px-4 pt-6 md:pt-10 pb-8 md:pb-12">
        <main className="max-w-3xl w-full text-center">
          <CategoryPageHeader category="self" />
          <CreateFlow category="self" />
          <MyPortraitsSection />
          <GallerySection items={getGalleryImagesForPage('self', false)} />
        </main>
      </div>
    </>
  )
}
