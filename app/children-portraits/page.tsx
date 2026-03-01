import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { MyPortraitsSection } from '@/components/home/my-portraits-section'
import { GallerySection } from '@/components/gallery-section'
import { CategoryJsonLd } from '@/components/category-json-ld'
import { CategoryPageHeader } from '@/components/category-page-header'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

export const metadata: Metadata = {
  title: "Custom Children Portraits – Personalized Artwork",
  description:
    "Custom children portraits. Personalized artwork. Perfect keepsake. Free preview. Print or download.",
  openGraph: {
    title: "Custom Children Portraits – Personalized Artwork",
    description:
      "Custom children portraits. Personalized artwork. Perfect keepsake. Free preview. Print or download.",
    url: "/children-portraits",
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
          <MyPortraitsSection />
          <GallerySection items={getGalleryImagesForPage('children', false)} />
        </main>
      </div>
    </>
  )
}
