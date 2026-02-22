'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
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

/**
 * Hidden until the user has at least one creation. Renders under the hero on the main page.
 * Shows "My portraits" and cards for each generation (same card UI as preview: Download 4K + Order Print).
 * Refetches when auth state changes (e.g. logout) so portraits update immediately.
 */
export function MyPortraitsSection() {
  const [generations, setGenerations] = useState<MyGenerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [packageModal, setPackageModal] = useState<{ generationId: string; variant: PreviewPackageVariant } | null>(null)

  const fetchGenerations = useCallback(() => {
    setLoading(true)
    fetch('/api/my-generations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations ?? []))
      .catch(() => setGenerations([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchGenerations()
  }, [fetchGenerations])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchGenerations()
    })
    return () => subscription.unsubscribe()
  }, [fetchGenerations])

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
      <p className="mt-3 text-sm text-muted-foreground">
        Love it? Get the high-res bundle or order a print for each portrait.
      </p>

      <PreviewPackageModal
        open={packageModal !== null}
        onClose={() => setPackageModal(null)}
        variant={packageModal?.variant ?? 'portrait-pack'}
        generationId={packageModal?.generationId ?? ''}
      />
    </section>
  )
}
