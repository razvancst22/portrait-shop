import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { MyPortraitsSection } from '@/components/home/my-portraits-section'
import { GallerySection } from '@/components/gallery-section'
import { CategoryJsonLd } from '@/components/category-json-ld'
import { CategoryPageHeader } from '@/components/category-page-header'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

export const metadata: Metadata = {
  title: "Custom Cat Portraits – Personalized Artwork",
  description:
    "Custom cat portraits. Personalized artwork. Free preview. Order framed print or download.",
  openGraph: {
    title: "Custom Cat Portraits – Personalized Artwork",
    description:
      "Custom cat portraits. Personalized artwork. Free preview. Order framed print or download.",
    url: "/cat-portraits",
  },
}

export default function CatPortraitsPage() {
  return (
    <>
      <CategoryJsonLd category="cat" />
      <div className="flex flex-col items-center px-4 pt-6 md:pt-10 pb-8 md:pb-12">
        <main className="max-w-3xl w-full text-center">
          <CategoryPageHeader category="cat" />
          <CreateFlow category="cat" />
          <MyPortraitsSection />
          <GallerySection items={getGalleryImagesForPage('cat', false)} />
        </main>
      </div>
    </>
  )
}
