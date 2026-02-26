'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Download, Printer, Sparkles } from 'lucide-react'
import { getButtonClassName } from '@/components/primitives/button'
import { ART_PRINT_OPTIONS } from '@/lib/pricing/constants'
import { cn } from '@/lib/utils'

type PreviewUpgradeOptionsProps = {
  generationId: string
  isPurchased: boolean
  /** Price for Get your Portrait (full or discounted) */
  getYourPortraitPrice: number
  /** Whether 1-hour discount is active */
  discountActive?: boolean
  onDownload?: () => void
  isDownloading?: boolean
  /** When true, only show the Print pricing card (for purchased portrait flow) */
  showOnlyPrintCard?: boolean
}

/**
 * Two pricing option cards for the preview page:
 * 1. Upgrade to Portrait (4K digital download)
 * 2. Upgrade to Print (physical museum-quality print)
 */
export function PreviewUpgradeOptions({
  generationId,
  isPurchased,
  getYourPortraitPrice,
  discountActive = false,
  onDownload,
  isDownloading = false,
  showOnlyPrintCard = false,
}: PreviewUpgradeOptionsProps) {
  const [artPrintOption, setArtPrintOption] = useState<(typeof ART_PRINT_OPTIONS)[number]>(
    ART_PRINT_OPTIONS[0]
  )

  const portraitSearch = new URLSearchParams({ generationId })
  if (discountActive) portraitSearch.set('useDiscount', 'true')
  const checkoutPortraitUrl = `/checkout?${portraitSearch.toString()}`

  const checkoutPrintUrl = `/checkout?generationId=${encodeURIComponent(generationId)}&print=${encodeURIComponent(artPrintOption.dimensions)}`

  return (
    <div className={cn('grid gap-4', showOnlyPrintCard ? 'max-w-md mx-auto sm:grid-cols-1' : 'sm:grid-cols-2')}>
      {/* Upgrade to Portrait */}
      {!showOnlyPrintCard && (
      <div
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300',
          'bg-gradient-to-br from-emerald-500/10 via-background to-background',
          'border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10'
        )}
      >
        <div className="absolute top-3 right-3">
          {discountActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-3" />
              33% off
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Download className="size-5" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Upgrade to Portrait
            </h3>
          </div>
          <p className="text-3xl font-heading font-bold tabular-nums text-foreground">
            <span className="text-lg font-normal align-top">$</span>
            {getYourPortraitPrice.toFixed(2)}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-emerald-500" aria-hidden />
              <span>Upgrade to 4K resolution</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-emerald-500" aria-hidden />
              <span>No watermark</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-emerald-500" aria-hidden />
              <span>Instant digital download</span>
            </li>
          </ul>
          <div className="mt-auto pt-5">
            {isPurchased ? (
              <button
                type="button"
                onClick={onDownload}
                disabled={isDownloading}
                className={getButtonClassName('default', 'lg', 'w-full rounded-xl gap-2 font-semibold')}
              >
                {isDownloading ? (
                  <>
                    <div className="size-5 animate-spin rounded-full border-2 border-background border-t-transparent shrink-0" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="size-5 shrink-0" />
                    Download
                  </>
                )}
              </button>
            ) : (
              <Link
                href={checkoutPortraitUrl}
                className={getButtonClassName('default', 'lg', 'w-full rounded-xl gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700')}
              >
                <Download className="size-5 shrink-0" />
                Get your Portrait
              </Link>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Upgrade to Print */}
      <div
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-300',
          'bg-gradient-to-br from-orange-500/10 via-background to-background',
          'border-orange-500/30 hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/10'
        )}
      >
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400">
              <Printer className="size-5" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Upgrade to Print
            </h3>
          </div>
          <div className="space-y-2">
            <label htmlFor="preview-print-size" className="text-sm font-medium text-foreground">
              Print size
            </label>
            <select
              id="preview-print-size"
              value={artPrintOption.dimensions}
              onChange={(e) => {
                const option = ART_PRINT_OPTIONS.find((o) => o.dimensions === e.target.value)
                if (option) setArtPrintOption(option)
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2"
            >
              {ART_PRINT_OPTIONS.map((opt) => (
                <option key={opt.dimensions} value={opt.dimensions}>
                  {opt.dimensions} — ${opt.price}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-3xl font-heading font-bold tabular-nums text-foreground">
            <span className="text-lg font-normal align-top">$</span>
            {artPrintOption.price}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-orange-500" aria-hidden />
              <span>Museum quality print</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-orange-500" aria-hidden />
              <span>Lasts over 100 years</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-orange-500" aria-hidden />
              <span>Free shipping worldwide</span>
            </li>
          </ul>
          <div className="mt-auto pt-5">
            <Link
              href={checkoutPrintUrl}
              className={getButtonClassName('default', 'lg', 'w-full rounded-xl gap-2 font-semibold bg-orange-600 hover:bg-orange-700')}
            >
              <Printer className="size-5 shrink-0" />
              {isPurchased ? 'Order Print' : 'Get Art Print Pack'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
