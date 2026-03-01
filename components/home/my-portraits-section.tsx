'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useAuth } from '@/providers/auth-provider'
import { ART_STYLE_PROMPTS } from '@/lib/prompts/artStyles'
import type { ArtStyleId } from '@/lib/prompts/artStyles'
import { PortraitActionCard } from '@/components/preview/portrait-action-card'
import { PreviewPackageModal, type PreviewPackageVariant } from '@/components/preview/preview-package-modal'
import { Button } from '@/components/primitives/button'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((d) => d.generations ?? [])

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
 * Shows "My portraits" and cards for each generation (same card UI as preview: Download 4K + Order Print).
 * Refetches when auth state changes (e.g. logout) so portraits update immediately.
 */
export function MyPortraitsSection() {
  const { user } = useAuth()
  const { data: generations = [], isLoading: loading, mutate } = useSWR<MyGenerationItem[]>(
    '/api/my-generations',
    fetcher,
    { revalidateOnFocus: false }
  )
  const [packageModal, setPackageModal] = useState<{ generationId: string; variant: PreviewPackageVariant } | null>(null)

  useEffect(() => {
    mutate()
  }, [mutate, user])

  if (loading || generations.length === 0) {
    return null
  }

  return (
    <section
      className="w-full max-w-3xl mx-auto mb-10 text-center"
      aria-label="Artworks"
      data-section="my-portraits"
    >
      <div className="flex flex-row items-center justify-between gap-4 mb-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          Artworks
        </h2>
        <Link href="/my-portraits">
          <Button variant="outline" size="sm" className="rounded-full shrink-0">
            View all my portraits
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 items-start w-full">
        {generations.slice(0, 2).map((gen) => (
          <PortraitActionCard
            key={gen.id}
            generationId={gen.id}
            imageUrl={gen.preview_image_url}
            imageAlt={`Portrait in ${styleDisplayName(gen.art_style)} style`}
            status={gen.status}
            isPurchased={gen.is_purchased}
            buttonsLayout="row"
            onOpenPackageModal={(variant) => setPackageModal({ generationId: gen.id, variant })}
            onDelete={async (id) => {
              const res = await fetch(`/api/generate/${id}`, { method: 'DELETE', credentials: 'include' })
              if (!res.ok) throw new Error('Delete failed')
              mutate()
            }}
          />
        ))}
      </div>

      <PreviewPackageModal
        open={packageModal !== null}
        onClose={() => setPackageModal(null)}
        variant={packageModal?.variant ?? 'portrait-pack'}
        generationId={packageModal?.generationId ?? ''}
      />
    </section>
  )
}
