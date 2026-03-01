import type { Metadata } from 'next'
import { CreateFlow } from '@/components/create-flow'
import { MyPortraitsSection } from '@/components/home/my-portraits-section'
import { GallerySection } from '@/components/gallery-section'
import { CategoryJsonLd } from '@/components/category-json-ld'
import { CategoryPageHeader } from '@/components/category-page-header'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

export const metadata: Metadata = {
  title: "Custom Couple Portraits – Personalized Artwork",
  description:
    "Custom couple portraits. Personalized artwork. Perfect gift. Free preview. Print or download.",
  openGraph: {
    title: "Custom Couple Portraits – Personalized Artwork",
    description:
      "Custom couple portraits. Personalized artwork. Perfect gift. Free preview. Print or download.",
    url: "/couple-portraits",
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
          <MyPortraitsSection />
          <GallerySection items={getGalleryImagesForPage('couple', false)} />
        </main>
      </div>
    </>
  )
}
