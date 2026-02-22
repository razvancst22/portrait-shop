import type { Metadata } from 'next'
import { HeroSection } from '@/components/home/hero-section'
import { MyPortraitsSection } from '@/components/home/my-portraits-section'
import { UploadSection } from '@/components/home/upload-section'
import { TrustLine } from '@/components/home/trust-line'
import CircularGallery from '@/components/CircularGallery'
import { GALLERY_IMAGES, getOptimalImageUrl } from '@/lib/gallery-images'

export const metadata: Metadata = {
  title: 'Classic Portraits for Pets, Family, Couples & More | petportrait.shop',
  description:
    'Turn your photos into Renaissance, Baroque, and Victorian masterpieces. Pet portraits, family portraits, couple portraits, children, and self-portraits. Free preview, one price.',
  openGraph: {
    title: 'Classic Portraits for Pets, Family, Couples & More | petportrait.shop',
    description: 'Turn your photos into Renaissance, Baroque, and Victorian masterpieces. Pet, family, couple, children, self-portraits.',
    url: '/',
  },
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 md:py-24">
      <main className="max-w-3xl w-full text-center">
        <div className="relative z-10">
          <HeroSection />
          {/* Upload option must always remain on the main page */}
          <UploadSection />
          {/* My portraits: hidden until user has creations; cards invite to purchase */}
          <MyPortraitsSection />
        </div>
        {/* Portrait gallery */}
        <section
          className="relative left-1/2 w-screen -translate-x-1/2 mt-16 z-0 px-4 md:px-6 box-border"
          style={{ height: '380px' }}
          aria-label="Portrait gallery"
        >
          <CircularGallery
            items={GALLERY_IMAGES.map((g) => ({ image: getOptimalImageUrl(g) }))}
            bend={0}
            borderRadius={0.05}
            scrollSpeed={0.8}
            scrollEase={0.08}
          />
        </section>
        <section className="mt-10">
          <TrustLine className="max-w-xl mx-auto text-center" />
        </section>
      </main>
    </div>
  )
}
