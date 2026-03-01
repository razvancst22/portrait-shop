import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { GallerySection } from '@/components/gallery-section'
import { CategoryJsonLd } from '@/components/category-json-ld'
import { CategoryPageHeader } from '@/components/category-page-header'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

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
      <div className="flex flex-col items-center px-4 pt-6 md:pt-10 pb-8 md:pb-12">
        <main className="max-w-3xl w-full text-center">
          <CategoryPageHeader category="children" />
          <CreateFlow category="children" />
          <GallerySection items={getGalleryImagesForPage('children', false)} />
        </main>
      </div>
    </>
  )
}
