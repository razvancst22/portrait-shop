'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/primitives/button'
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

export default function MyPortraitsPage() {
  const [credits, setCredits] = useState<number | null>(null)
  const [generations, setGenerations] = useState<MyGenerationItem[]>([])
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [loadingGenerations, setLoadingGenerations] = useState(true)

  const loadCredits = useCallback(() => {
    setLoadingCredits(true)
    fetch('/api/credits', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setCredits(d.balance ?? null))
      .catch(() => setCredits(null))
      .finally(() => setLoadingCredits(false))
  }, [])

  const loadGenerations = useCallback(() => {
    setLoadingGenerations(true)
    fetch('/api/my-generations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations ?? []))
      .catch(() => setGenerations([]))
      .finally(() => setLoadingGenerations(false))
  }, [])

  useEffect(() => {
    loadCredits()
    loadGenerations()
  }, [loadCredits, loadGenerations])

  const unpurchasedCount = generations.filter((g) => g.status === 'completed' && !g.is_purchased).length

  return (
    <div className="px-4 py-12 md:py-16">
      <main className="w-full max-w-3xl mx-auto text-left">
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
          My Portraits
        </h1>
        <p className="text-muted-foreground mb-6">
          View your creations and purchase high-resolution downloads.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="text-sm text-muted-foreground">
            {loadingCredits ? '…' : `${credits ?? 0} credits remaining`}
          </span>
          {unpurchasedCount > 0 && (
            <Link href="/cart" className="text-sm font-medium text-primary hover:underline">
              Cart ({unpurchasedCount}) →
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Artwork</h2>
          <Link
            href="/create"
            className="text-sm font-medium text-primary hover:underline"
          >
            Create new portrait →
          </Link>
        </div>

        {loadingGenerations ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 aspect-[4/5] animate-pulse" />
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <p className="text-muted-foreground mb-4">No portraits yet.</p>
            <Link href="/create">
              <Button className="rounded-full">Create your first portrait</Button>
            </Link>
          </div>
        ) : (
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
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-2">
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
                    <Link href={`/preview/${gen.id}`} className="text-xs font-medium text-primary hover:underline">
                      Get full resolution – ${DIGITAL_BUNDLE_PRICE_USD}
                    </Link>
                  ) : gen.status === 'failed' ? (
                    <Link href="/create" className="text-xs font-medium text-primary hover:underline">
                      Try again
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-8 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  )
}
