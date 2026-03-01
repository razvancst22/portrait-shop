'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { GalleryImage } from '@/lib/gallery-images'

interface ResponsiveGalleryProps {
  items: GalleryImage[]
  /** Auto-advance interval in ms (default 3000). Set 0 to disable. */
  intervalMs?: number
}

/**
 * Mobile-only gallery: 2 cards, aspect-[4/5], object-cover (no stretch).
 * Desktop/tablet use CircularGallery – this is hidden on sm+.
 * Auto-advances to the next photo(s) every intervalMs to match CircularGallery behavior.
 */
export function ResponsiveGallery({ items, intervalMs = 3000 }: ResponsiveGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!intervalMs || items.length <= 2) return
    const el = scrollRef.current
    if (!el) return

    const advance = () => {
      const cardWidth = el.clientWidth / 2 - 8 // 2 cards, gap-4 = 1rem
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return

      let next = el.scrollLeft + cardWidth
      if (next >= maxScroll) next = 0
      el.scrollTo({ left: next, behavior: 'smooth' })
    }

    const id = window.setInterval(advance, intervalMs)
    return () => window.clearInterval(id)
  }, [items.length, intervalMs])

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scrollbar-hide"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      } as React.CSSProperties}
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
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
