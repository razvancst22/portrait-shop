'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Card, CardContent } from '@/components/primitives/card'
import { Skeleton } from '@/components/primitives/skeleton'
import { cn } from '@/lib/utils'
import type { SubjectTypeId } from '@/lib/prompts/artStyles'

type StyleItem = {
  id: string
  name: string
  description: string
  exampleImageUrl: string
}

export type StylesModalProps = {
  open: boolean
  onClose: () => void
  category?: SubjectTypeId
  /** When set, selecting a style will trigger generate and call onGenerateSuccess with the generation ID */
  imageUrl?: string | null
  onGenerateSuccess?: (generationId: string) => void
}

/**
 * Modal that lists all available portrait styles. When imageUrl is provided,
 * selecting a style runs generation and redirects via onGenerateSuccess.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export function StylesModal({
  open,
  onClose,
  category = 'pet',
  imageUrl,
  onGenerateSuccess,
}: StylesModalProps) {
  const mounted = useMounted()
  const [styles, setStyles] = useState<StyleItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatingStyleId, setGeneratingStyleId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    setError(null)
    setLoading(true)
    fetch(`/api/styles?category=${category}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load styles')
        return r.json()
      })
      .then(setStyles)
      .catch(() => setError('Could not load styles. Try again.'))
      .finally(() => setLoading(false))
  }, [open, category])

  const handleSelectStyle = async (styleId: string) => {
    if (imageUrl) {
      setGeneratingStyleId(styleId)
      setError(null)
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            artStyle: styleId,
            subjectType: category,
          }),
          credentials: 'include',
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          if (res.status === 403 && err.code === 'INSUFFICIENT_CREDITS') {
            setError(err.error ?? "You've used your free portraits. Sign in or buy Portrait Generations.")
          } else {
            setError(err.error || `Generation failed: ${res.status}`)
          }
          return
        }
        const { generationId } = await res.json()
        onClose()
        onGenerateSuccess?.(generationId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setGeneratingStyleId(null)
      }
    } else {
      onClose()
    }
  }

  if (!open) return null

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="styles-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between shrink-0 p-4 border-b border-border">
          <h2 id="styles-modal-title" className="font-heading text-xl font-semibold text-foreground">
            Pick a style
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-[280px]">
          {imageUrl && (
            <p className="text-sm text-muted-foreground mb-4">
              Select a style to generate your portrait. Your photo will be transformed into classic art.
            </p>
          )}
          {!imageUrl && (
            <p className="text-sm text-muted-foreground mb-4">
              Upload a photo above, then pick a style to create your portrait.
            </p>
          )}
          {error && (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="status" aria-label="Loading styles">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-border overflow-hidden bg-card">
                  <Skeleton className="aspect-[4/5] w-full rounded-none" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error && styles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Could not load styles.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
              {styles.map((style) => (
                <Card
                  key={style.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectStyle(style.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectStyle(style.id)}
                  className={cn(
                    'cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md hover:bg-primary/[0.03] p-0 overflow-hidden',
                    generatingStyleId === style.id && 'ring-2 ring-primary border-primary'
                  )}
                >
                  <CardContent className="p-0">
                    <div className="aspect-[4/5] relative w-full overflow-hidden bg-muted">
                      <Image
                        src={style.exampleImageUrl}
                        alt={style.name}
                        fill
                        className="object-cover object-center size-full"
                        sizes="(max-width: 640px) 50vw, 33vw"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      {generatingStyleId === style.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <span className="text-sm font-medium">Creating…</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-medium text-foreground text-sm">{style.name}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{style.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return mounted ? createPortal(modal, document.body) : null
}