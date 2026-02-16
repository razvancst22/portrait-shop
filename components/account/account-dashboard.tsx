'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, Download, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/primitives/button'
import { ART_STYLE_PROMPTS } from '@/lib/prompts/artStyles'
import type { ArtStyleId } from '@/lib/prompts/artStyles'
import { DIGITAL_BUNDLE_PRICE_USD } from '@/lib/constants'
import { cn } from '@/lib/utils'

const WELCOME_BANNER_KEY = 'petportrait_account_welcome_dismissed'

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

export function AccountDashboard() {
  const [credits, setCredits] = useState<number | null>(null)
  const [generations, setGenerations] = useState<MyGenerationItem[]>([])
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [loadingGenerations, setLoadingGenerations] = useState(true)
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean | null>(null)
  const [hideVariants, setHideVariants] = useState(false)

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
    if (typeof window !== 'undefined') {
      setWelcomeDismissed(localStorage.getItem(WELCOME_BANNER_KEY) === '1')
    } else {
      setWelcomeDismissed(false)
    }
  }, [])

  useEffect(() => {
    loadCredits()
    loadGenerations()
  }, [loadCredits, loadGenerations])

  const dismissWelcome = () => {
    setWelcomeDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem(WELCOME_BANNER_KEY, '1')
    }
  }

  const displayGenerations = hideVariants
    ? generations.filter((g, i, arr) => arr.findIndex((x) => x.art_style === g.art_style) === i)
    : generations

  return (
    <div className="w-full max-w-3xl mx-auto text-left">
      <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-6">
        My Masterpieces
      </h1>

      {welcomeDismissed === false && (
        <div className="relative rounded-2xl bg-primary/15 border border-primary/30 p-6 mb-8">
          <button
            type="button"
            onClick={dismissWelcome}
            className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-background/50 hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="size-5" />
          </button>
          <div className="flex items-start gap-4">
            <span className="text-3xl opacity-80" aria-hidden>✨</span>
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">
                Welcome to Your Pack! 🎨
              </h2>
              <p className="text-foreground/90 mt-1">
                Your {credits ?? 2} credit{credits !== 1 ? 's' : ''} {credits === 1 ? 'is' : 'are'} ready!
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Upload an image below to start creating your first masterpiece.
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-muted-foreground mb-4">
        View and download all your created artwork.
      </p>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={hideVariants}
            onChange={(e) => setHideVariants(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-sm text-muted-foreground">Hide variants</span>
        </label>
        {generations.some((g) => g.status === 'completed' && !g.is_purchased) && (
          <Link href="/cart" className="text-sm font-medium text-primary hover:underline">
            Cart ({generations.filter((g) => g.status === 'completed' && !g.is_purchased).length}) →
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => { loadGenerations(); loadCredits(); }}
          disabled={loadingGenerations || loadingCredits}
        >
          <RefreshCw className={cn('size-4', (loadingGenerations || loadingCredits) && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">Your Plan:</p>
        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
          Free
        </span>
        <div className="flex flex-wrap gap-6 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Star className="size-4 text-primary/80" />
            {loadingCredits ? '…' : `${credits ?? 0} credits remaining`}
          </span>
          <span className="flex items-center gap-2">
            <Download className="size-4 text-primary/80" />
            0/0 downloads
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Artwork
        </h2>
        <Link
          href="/pet-portraits"
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
      ) : displayGenerations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-muted-foreground mb-4">No portraits yet.</p>
          <Link
            href="/pet-portraits"
            className="inline-block rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create your first portrait
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {displayGenerations.map((gen) => (
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
      )}

      <p className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}
