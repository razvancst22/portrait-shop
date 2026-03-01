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
import { Skeleton } from '@/components/primitives/skeleton'
import { ArrowLeft } from 'lucide-react'

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

export type ViewMode = 'all' | 'generated' | 'purchased'

export type MyPortraitsContentProps = {
  /** Layout: 'page' = standalone page with full width; 'embedded' = inside card (account) */
  variant?: 'page' | 'embedded'
  /** Optional className for the container */
  className?: string
}

/** Full grid for "See all" view */
const gridClasses = 'grid grid-cols-2 sm:grid-cols-3 gap-4 items-start'

/** Single row (horizontal scroll) for default preview - same card sizing */
const scrollRowClasses =
  'flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scrollbar-hide'
const scrollCardClasses = 'flex-shrink-0 w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.5rem)] snap-center'

/**
 * Shared My Portraits grid component. Used in /my-portraits page and account dashboard.
 * Fetches generations, shows Generated Artworks (preview) and Purchased Artworks in separate sections.
 */
export function MyPortraitsContent({
  variant = 'page',
  className = '',
}: MyPortraitsContentProps) {
  const { user } = useAuth()
  const { data: generations = [], isLoading: loading, mutate } = useSWR<MyGenerationItem[]>(
    '/api/my-generations',
    fetcher,
    { revalidateOnFocus: false }
  )
  const [packageModal, setPackageModal] = useState<{ generationId: string; variant: PreviewPackageVariant } | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')

  useEffect(() => {
    mutate()
  }, [mutate, user])

  const generated = generations.filter((g) => !g.is_purchased)
  const purchased = generations.filter((g) => g.is_purchased)

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
      <p className="text-muted-foreground mb-4">No portraits yet.</p>
      <Link href="/">
        <Button className="rounded-full">Create your first portrait</Button>
      </Link>
    </div>
  )

  const sectionHeader = (title: string, onSeeAll?: () => void) => (
    <div className="flex items-center justify-between gap-4 mb-4">
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      {onSeeAll != null && (
        <button
          type="button"
          onClick={onSeeAll}
          className="text-sm font-medium text-primary hover:underline shrink-0"
        >
          See all
        </button>
      )}
    </div>
  )

  const backToAll = (
    <button
      type="button"
      onClick={() => setViewMode('all')}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
    >
      <ArrowLeft className="size-4" />
      View all
    </button>
  )

  const renderCard = (gen: MyGenerationItem, isPurchased: boolean) => (
    <PortraitActionCard
      key={gen.id}
      generationId={gen.id}
      imageUrl={gen.preview_image_url}
      imageAlt={`Portrait in ${styleDisplayName(gen.art_style)} style`}
      status={gen.status}
      isPurchased={isPurchased}
      buttonsLayout="row"
      className=""
      onOpenPackageModal={(v) => setPackageModal({ generationId: gen.id, variant: v })}
      onDelete={async (id) => {
        const res = await fetch(`/api/generate/${id}`, { method: 'DELETE', credentials: 'include' })
        if (!res.ok) throw new Error('Delete failed')
        mutate()
      }}
    />
  )

  /** Single row - for default preview */
  const renderScrollRow = (items: MyGenerationItem[], isPurchased: boolean) => (
    <div
      className={scrollRowClasses}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      aria-label={isPurchased ? 'Purchased artworks' : 'Generated artworks'}
    >
      {items.map((gen) => (
        <div key={gen.id} className={scrollCardClasses}>
          {renderCard(gen, isPurchased)}
        </div>
      ))}
    </div>
  )

  /** Full grid - for "See all" view */
  const renderGrid = (items: MyGenerationItem[], isPurchased: boolean) => (
    <div className={gridClasses}>{items.map((gen) => renderCard(gen, isPurchased))}</div>
  )

  const content = loading ? (
    <div className={gridClasses}>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="rounded-xl aspect-[4/5]" />
      ))}
    </div>
  ) : generations.length === 0 ? (
    emptyState
  ) : viewMode === 'generated' ? (
    <>
      {backToAll}
      {sectionHeader('Generated Artworks')}
      {renderGrid(generated, false)}
    </>
  ) : viewMode === 'purchased' ? (
    <>
      {backToAll}
      {sectionHeader('Purchased Artworks')}
      {renderGrid(purchased, true)}
    </>
  ) : (
    <>
      {generated.length > 0 && (
        <div className="mb-8">
          {sectionHeader('Generated Artworks', () => setViewMode('generated'))}
          {renderScrollRow(generated, false)}
        </div>
      )}
      {purchased.length > 0 && (
        <div>
          {sectionHeader('Purchased Artworks', () => setViewMode('purchased'))}
          {renderScrollRow(purchased, true)}
        </div>
      )}
    </>
  )

  return (
    <div className={className}>
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
