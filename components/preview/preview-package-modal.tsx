'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { getButtonClassName } from '@/components/primitives/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const ART_PRINT_OPTIONS = [
  { dimensions: '8×10"', price: 89 },
  { dimensions: '12×16"', price: 119 },
  { dimensions: '18×24"', price: 199 },
  { dimensions: '24×36"', price: 299 },
] as const

export type PreviewPackageVariant = 'portrait-pack' | 'art-print-pack'

type PreviewPackageModalProps = {
  open: boolean
  onClose: () => void
  variant: PreviewPackageVariant
  generationId: string
  className?: string
}

/**
 * Modal that shows the singular package CTA: either Portrait Pack (for Download 4K)
 * or Art Print Pack (for Order Print). Content matches pricing page.
 */
export function PreviewPackageModal({
  open,
  onClose,
  variant,
  generationId,
  className,
}: PreviewPackageModalProps) {
  const [artPrintOption, setArtPrintOption] = useState<(typeof ART_PRINT_OPTIONS)[number]>(
    ART_PRINT_OPTIONS[0]
  )

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

  if (!open) return null

  const portraitPackContent = (
    <>
      <h2 id="preview-package-modal-title" className="font-heading text-xl font-semibold text-foreground pr-8">
        Portrait Pack
      </h2>
      <div className="mt-2 text-center">
        <p className="text-3xl font-heading font-semibold tabular-nums">
          <span className="text-lg align-top">$</span>20
        </p>
      </div>
      <ul className="space-y-2 text-sm text-foreground">
        <li className="flex gap-2">
          <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
          <span>5 Credits</span>
        </li>
        <li className="flex gap-2">
          <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
          <span>1 High Res Download ready to print</span>
        </li>
        <li className="flex gap-2">
          <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
          <span>Lifetime access to your portrait</span>
        </li>
      </ul>
      <Link
        href={`/checkout?generationId=${encodeURIComponent(generationId)}`}
        className={getButtonClassName('default', 'lg', 'w-full rounded-xl')}
      >
        Get Portrait Pack
      </Link>
    </>
  )

  const artPrintPackContent = (
    <>
      <h2 id="preview-package-modal-title" className="font-heading text-xl font-semibold text-foreground pr-8">
        Art Print Pack
      </h2>
      <div className="mt-4 space-y-3">
        <label htmlFor="preview-art-print-size" className="text-sm font-medium text-foreground block">
          Print size
        </label>
        <select
          id="preview-art-print-size"
          value={artPrintOption.dimensions}
          onChange={(e) => {
            const option = ART_PRINT_OPTIONS.find((o) => o.dimensions === e.target.value)
            if (option) setArtPrintOption(option)
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {ART_PRINT_OPTIONS.map((opt) => (
            <option key={opt.dimensions} value={opt.dimensions}>
              {opt.dimensions} – ${opt.price}
            </option>
          ))}
        </select>
        <p className="text-3xl font-heading font-semibold tabular-nums text-center">
          <span className="text-lg align-top">$</span>
          {artPrintOption.price}
        </p>
      </div>
      <ul className="space-y-2 text-sm text-foreground">
        <li className="flex gap-2">
          <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
          <span>10 credits – Creator pack included</span>
        </li>
      </ul>
      <Link
        href={`/checkout?generationId=${encodeURIComponent(generationId)}&print=${encodeURIComponent(artPrintOption.dimensions)}`}
        className={getButtonClassName('default', 'lg', 'w-full rounded-xl')}
      >
        Get Art Print Pack
      </Link>
    </>
  )

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-package-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl flex flex-col gap-4',
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <span className="text-xl leading-none">×</span>
        </button>
        {variant === 'portrait-pack' ? portraitPackContent : artPrintPackContent}
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}
