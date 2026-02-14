'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ART_STYLE_PROMPTS } from '@/lib/prompts/artStyles'
import type { ArtStyleId } from '@/lib/prompts/artStyles'
import { DIGITAL_BUNDLE_PRICE_USD } from '@/lib/constants'

type MyGenerationItem = {
  id: string
  art_style: string
  status: string
  preview_image_url: string | null
  is_purchased: boolean
  created_at: string
}

function styleDisplayName(artStyle: string): string {
  const id = artStyle as ArtStyleId
  return ART_STYLE_PROMPTS[id]?.name ?? artStyle
}

/**
 * Hidden until the user has at least one creation. Renders under the hero on the main page.
 * Shows "My portraits" and cards for each generation, with CTAs to purchase / get high-res.
 */
export function MyPortraitsSection() {
  const [generations, setGenerations] = useState<MyGenerationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/my-generations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations ?? []))
      .catch(() => setGenerations([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || generations.length === 0) {
    return null
  }

  return (
    <section
      className="w-full max-w-3xl mx-auto mb-10 text-center"
      aria-label="Your portraits"
      data-section="my-portraits"
    >
      <h2 className="font-heading text-xl font-semibold text-foreground mb-4">
        My portraits
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {generations.map((gen) => (
          <article
            key={gen.id}
            className="rounded-xl border border-border bg-card overflow-hidden flex flex-col"
          >
            <Link
              href={`/preview/${gen.id}`}
              className="relative block w-full overflow-hidden bg-muted rounded-t-xl"
              style={{ aspectRatio: '4/5' }}
            >
              {gen.preview_image_url && gen.status === 'completed' ? (
                <img
                  src={gen.preview_image_url}
                  alt={`Portrait in ${styleDisplayName(gen.art_style)} style`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                  {gen.status === 'completed' ? 'No preview' : gen.status === 'failed' ? 'Failed' : 'Creating…'}
                </div>
              )}
            </Link>
            <div className="p-3 flex flex-col gap-2 flex-1">
              <p className="text-sm font-medium text-foreground">
                {styleDisplayName(gen.art_style)}
              </p>
              {gen.is_purchased ? (
                <span className="text-xs text-muted-foreground">Purchased</span>
              ) : gen.status === 'completed' ? (
                <Link
                  href={`/preview/${gen.id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Get full resolution – ${DIGITAL_BUNDLE_PRICE_USD}
                </Link>
              ) : gen.status === 'failed' ? (
                <Link
                  href="/pet-portraits"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Try again
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Love it? Get the high-res bundle for each portrait – no re-generation.
      </p>
    </section>
  )
}
