import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/hero-section'
import { MyPortraitsSection } from '@/components/home/my-portraits-section'
import { CreateFlow } from '@/components/create-flow'
import { GallerySection } from '@/components/gallery-section'
import { getGalleryImagesForPage } from '@/lib/gallery-images'

export const metadata: Metadata = {
  title: "Custom Pet Portraits – Dog, Cat, Family & Couple",
  description:
    "Custom pet portraits, dog, cat, family, couple, children. Personalized artwork. Free preview. Order framed print or download.",
  openGraph: {
    title: "Custom Pet Portraits – Dog, Cat, Family & Couple",
    description:
      "Custom pet portraits, dog, cat, family, couple, children. Personalized artwork. Free preview. Order framed print or download.",
    url: "/",
  },
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center px-4 pt-6 md:pt-10 pb-8 md:pb-12">
      <main className="max-w-3xl w-full text-center">
        <div className="relative z-10">
          <HeroSection />
          {/* Create flow for all portrait types – pet, dog, cat, family, couple, children, self */}
          <CreateFlow category="pet" />
          {/* My portraits: hidden until user has creations; cards invite to purchase */}
          <MyPortraitsSection />
        </div>
        {/* Portrait gallery – home images, same style as category pages */}
        <GallerySection items={getGalleryImagesForPage('pet', true)} />
      </main>
    </div>
  )
}
