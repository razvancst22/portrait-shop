'use client'

import CircularGallery from '@/components/CircularGallery'
import { ResponsiveGallery } from '@/components/home/ResponsiveGallery'
import { getOptimalImageUrl, type GalleryImage } from '@/lib/gallery-images'

/** Shared gallery section – same CircularGallery style, accepts any images. */
export function GallerySection({ items }: { items: GalleryImage[] }) {
  return (
    <section
      className="relative left-1/2 w-screen min-w-screen shrink-0 -translate-x-1/2 mt-8 z-10 px-4 md:px-6 box-border"
      aria-label="Portrait gallery"
    >
      <div className="block sm:hidden">
        <ResponsiveGallery items={items} intervalMs={3000} />
      </div>
      <div className="hidden sm:block" style={{ height: '440px' }}>
        <CircularGallery
          items={items.map((g) => ({ image: getOptimalImageUrl(g) }))}
          bend={0}
          borderRadius={0.05}
          scrollEase={0.08}
          intervalMs={3000}
        />
      </div>
    </section>
  )
}
