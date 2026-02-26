'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { getButtonClassName } from '@/components/primitives/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ART_PRINT_OPTIONS } from '@/lib/pricing/constants'
import { CountdownOfferBanner } from './countdown-offer-banner'

export type PreviewPackageVariant = 'portrait-pack' | 'art-print-pack'

type PreviewPackageModalProps = {
  open: boolean
  onClose: () => void
  variant: PreviewPackageVariant
  generationId: string
  isPurchased?: boolean
  /** Price for Get your Portrait (full or discounted) */
  getYourPortraitPrice?: number
  /** Whether 1-hour discount is active */
  discountActive?: boolean
  /** When discount expires (ms timestamp) - show countdown in modal */
  discountExpiresAt?: number
  className?: string
}

/**
 * Modal that shows Get your Portrait (for Download 4K) or Art Print Pack (for Order Print).
 * Content matches pricing page.
 */
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export function PreviewPackageModal({
  open,
  onClose,
  variant,
  generationId,
  isPurchased = false,
  getYourPortraitPrice = 14.99,
  discountActive = false,
  discountExpiresAt,
  className,
}: PreviewPackageModalProps) {
  const mounted = useMounted()
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

  const checkoutUrl = new URL('/checkout', window.location.origin)
  checkoutUrl.searchParams.set('generationId', generationId)
  if (discountActive) checkoutUrl.searchParams.set('useDiscount', 'true')

  const portraitPackContent = (
    <>
      <h2 id="preview-package-modal-title" className="font-heading text-xl font-semibold text-foreground pr-8">
        Get your Portrait
      </h2>
      {discountExpiresAt != null && discountActive && (
        <CountdownOfferBanner expiresAt={discountExpiresAt} onExpired={onClose} className="mb-2" />
      )}
      <div className="mt-2 text-center">
        <p className="text-3xl font-heading font-semibold tabular-nums">
          <span className="text-lg align-top">$</span>
          {getYourPortraitPrice.toFixed(2)}
        </p>
        {discountActive && (
          <p className="text-xs text-muted-foreground mt-1">33% off limited time offer</p>
        )}
      </div>
      <ul className="space-y-2 text-sm text-foreground">
        <li className="flex gap-2">
          <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
          <span>Upgrade to 4K</span>
        </li>
        <li className="flex gap-2">
          <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
          <span>No watermark</span>
        </li>
      </ul>
      {isPurchased ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">You own this portrait</p>
          <p className="text-xs text-muted-foreground">Use the Download button to get your high-res file</p>
        </div>
      ) : (
        <Link
          href={checkoutUrl.toString()}
          className={getButtonClassName('default', 'lg', 'w-full rounded-xl')}
        >
          Get your Portrait
        </Link>
      )}
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
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2"
        >
          {ART_PRINT_OPTIONS.map((opt) => (
            <option key={opt.dimensions} value={opt.dimensions}>
              {opt.dimensions}
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
          <Check className="size-4 text-orange-500 shrink-0 mt-0.5" aria-hidden />
          <span>Museum quality print</span>
        </li>
        <li className="flex gap-2">
          <Check className="size-4 text-orange-500 shrink-0 mt-0.5" aria-hidden />
          <span>Last over 100 years</span>
        </li>
        <li className="flex gap-2">
          <Check className="size-4 text-orange-500 shrink-0 mt-0.5" aria-hidden />
          <span>Free shipping worldwide</span>
        </li>
      </ul>
      <Link
        href={`/checkout?generationId=${encodeURIComponent(generationId)}&print=${encodeURIComponent(artPrintOption.dimensions)}`}
        className={getButtonClassName('default', 'lg', 'w-full rounded-xl gap-2 font-semibold bg-orange-600 hover:bg-orange-700')}
      >
        {isPurchased ? 'Order Print' : 'Get Art Print Pack'}
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

  return mounted ? createPortal(modal, document.body) : null
}
