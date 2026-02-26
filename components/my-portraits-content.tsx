'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { ART_STYLE_PROMPTS } from '@/lib/prompts/artStyles'
import type { ArtStyleId } from '@/lib/prompts/artStyles'
import { PortraitActionCard } from '@/components/preview/portrait-action-card'
import { PreviewPackageModal, type PreviewPackageVariant } from '@/components/preview/preview-package-modal'
import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { Palette } from 'lucide-react'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((r) => r.json()).then((d) => d.generations ?? [])

export type MyGenerationItem = {
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

export type MyPortraitsContentProps = {
  /** Show "Create new portrait" link in header */
  showCreateLink?: boolean
  /** Layout: 'page' = standalone page with full width; 'embedded' = inside card (account) */
  variant?: 'page' | 'embedded'
  /** Optional className for the container */
  className?: string
}

/**
 * Shared My Portraits grid component. Used in /my-portraits page and account dashboard.
 * Fetches generations, shows unpurchased first, then purchased section.
 */
export function MyPortraitsContent({
  showCreateLink = true,
  variant = 'page',
  className = '',
}: MyPortraitsContentProps) {
  const { data: generations = [], isLoading: loading, mutate } = useSWR<MyGenerationItem[]>(
    '/api/my-generations',
    fetcher,
    { revalidateOnFocus: false }
  )
  const [packageModal, setPackageModal] = useState<{ generationId: string; variant: PreviewPackageVariant } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      mutate()
    })
    return () => subscription.unsubscribe()
  }, [mutate])

  const unpurchased = generations.filter((g) => !g.is_purchased)
  const purchased = generations.filter((g) => g.is_purchased)

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
        <Palette className="size-5" />
        My Portraits
      </h2>
      {showCreateLink && (
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Create new portrait →
        </Link>
      )}
    </div>
  )

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
      <p className="text-muted-foreground mb-4">No portraits yet.</p>
      <Link href="/">
        <Button className="rounded-full">Create your first portrait</Button>
      </Link>
    </div>
  )

  const grid = (
    <>
      {unpurchased.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-start">
          {unpurchased.map((gen) => (
            <PortraitActionCard
              key={gen.id}
              generationId={gen.id}
              imageUrl={gen.preview_image_url}
              imageAlt={`Portrait in ${styleDisplayName(gen.art_style)} style`}
              status={gen.status}
              isPurchased={false}
              buttonsLayout="row"
              onOpenPackageModal={(v) => setPackageModal({ generationId: gen.id, variant: v })}
            />
          ))}
        </div>
      )}
      {purchased.length > 0 && (
        <div className={unpurchased.length > 0 ? 'mt-8' : ''}>
          <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500" aria-hidden />
            Purchased
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-start">
            {purchased.map((gen) => (
              <PortraitActionCard
                key={gen.id}
                generationId={gen.id}
                imageUrl={gen.preview_image_url}
                imageAlt={`Portrait in ${styleDisplayName(gen.art_style)} style`}
                status={gen.status}
                isPurchased={true}
                buttonsLayout="row"
                className="ring-2 ring-emerald-500 ring-offset-2 ring-offset-background"
                onOpenPackageModal={(v) => setPackageModal({ generationId: gen.id, variant: v })}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )

  const content = loading ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-start">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="rounded-xl aspect-[4/5]" />
      ))}
    </div>
  ) : generations.length === 0 ? (
    emptyState
  ) : (
    grid
  )

  return (
    <div className={className}>
      {header}
      {content}
      <PreviewPackageModal
        open={packageModal !== null}
        onClose={() => setPackageModal(null)}
        variant={packageModal?.variant ?? 'portrait-pack'}
        generationId={packageModal?.generationId ?? ''}
        isPurchased={packageModal ? generations.find((g) => g.id === packageModal.generationId)?.is_purchased ?? false : false}
      />
    </div>
  )
}
