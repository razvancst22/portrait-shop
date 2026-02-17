'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { ART_STYLE_PROMPTS } from '@/lib/prompts/artStyles'
import type { ArtStyleId } from '@/lib/prompts/artStyles'
import { PortraitActionCard } from '@/components/preview/portrait-action-card'
import { PreviewPackageModal, type PreviewPackageVariant } from '@/components/preview/preview-package-modal'

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
  const [packageModal, setPackageModal] = useState<{ generationId: string; variant: PreviewPackageVariant } | null>(null)

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
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            Create new portrait →
          </Link>
        </div>

        {loadingGenerations ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-start">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="rounded-xl aspect-[4/5]" />
            ))}
          </div>
        ) : generations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <p className="text-muted-foreground mb-4">No portraits yet.</p>
            <Link href="/">
              <Button className="rounded-full">Create your first portrait</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-start">
            {generations.map((gen) => (
              <PortraitActionCard
                key={gen.id}
                generationId={gen.id}
                imageUrl={gen.preview_image_url}
                imageAlt={`Portrait in ${styleDisplayName(gen.art_style)} style`}
                status={gen.status}
                isPurchased={gen.is_purchased}
                buttonsLayout="row"
                onOpenPackageModal={(variant) => setPackageModal({ generationId: gen.id, variant })}
              />
            ))}
          </div>
        )}

        <PreviewPackageModal
          open={packageModal !== null}
          onClose={() => setPackageModal(null)}
          variant={packageModal?.variant ?? 'portrait-pack'}
          generationId={packageModal?.generationId ?? ''}
        />

        <p className="mt-8 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  )
}
