'use client'

import CircularGallery from '@/components/CircularGallery'
import { getOptimalImageUrl, type GalleryImage } from '@/lib/gallery-images'

/** Shared gallery section – same CircularGallery style, accepts any images. */
export function GallerySection({ items }: { items: GalleryImage[] }) {
  return (
    <section
      className="relative left-1/2 w-screen -translate-x-1/2 mt-16 z-10 px-4 md:px-6 box-border"
      style={{ height: '440px' }}
      aria-label="Portrait gallery"
    >
      <CircularGallery
        items={items.map((g) => ({ image: getOptimalImageUrl(g) }))}
        bend={0}
        borderRadius={0.05}
        scrollEase={0.08}
        intervalMs={3000}
      />
    </section>
  )
}
