'use client'

import Image from 'next/image'
import type { GalleryImage } from '@/lib/gallery-images'

interface ResponsiveGalleryProps {
  items: GalleryImage[]
}

/**
 * Mobile-only gallery: 2 cards, aspect-[4/5], object-cover (no stretch).
 * Desktop/tablet use CircularGallery – this is hidden on sm+.
 */
export function ResponsiveGallery({ items }: ResponsiveGalleryProps) {
  return (
    <div
      className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scrollbar-hide"
      aria-label="Portrait gallery"
    >
      {items.map((img) => (
        <div
          key={img.id}
          className="flex-shrink-0 w-[calc(50%-0.5rem)] snap-center"
        >
          <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-muted/20 shadow-lg">
            <Image
              src={img.sources.webp.md}
              alt={img.text}
              fill
              className="object-cover object-center"
              sizes="50vw"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
