'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { dispatchCreditsUpdated } from '@/lib/credits-events'
import { getButtonClassName } from '@/components/primitives/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/primitives/card'
import { cn } from '@/lib/utils'
import { DIGITAL_PACKS } from '@/lib/pricing/constants'
import type { DigitalPackId } from '@/lib/pricing/constants'
import { Check, Loader2 } from 'lucide-react'

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

type AddCreditsModalProps = {
  open: boolean
  onClose: () => void
  /** When false, pack buttons redirect to create account instead of checkout */
  isLoggedIn?: boolean
  /** Called when credits are added (bypass mode) – e.g. to refresh balance */
  onCreditsAdded?: () => void
  className?: string
}

type HoveredPack = 'starter' | 'creator' | 'artist' | null

/**
 * Modal shown for Add Credits - displays 3 digital pack options matching the pricing page style.
 * Handles purchase in-modal: bypass adds credits and redirects to account; Stripe redirects to checkout.
 */
export function AddCreditsModal({ open, onClose, isLoggedIn = true, onCreditsAdded, className }: AddCreditsModalProps) {
  const router = useRouter()
  const mounted = useMounted()
  const [hoveredPack, setHoveredPack] = useState<HoveredPack>(null)
  const [purchasingPack, setPurchasingPack] = useState<DigitalPackId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isCreatorDimmed = hoveredPack === 'starter' || hoveredPack === 'artist'

  const handlePurchase = async (pack: DigitalPackId) => {
    if (!isLoggedIn) {
      router.push(`/create-account?redirect=${encodeURIComponent(`/checkout?pack=${pack}`)}`)
      onClose()
      return
    }
    setError(null)
    setPurchasingPack(pack)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (data.bypass) {
        dispatchCreditsUpdated()
        onCreditsAdded?.()
        onClose()
        router.push('/account')
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      if (data.code === 'SIGN_IN_REQUIRED') {
        router.push(`/login?redirect=${encodeURIComponent(`/checkout?pack=${pack}`)}`)
        onClose()
        return
      }
      if (data.code === 'STRIPE_NOT_CONFIGURED') {
        setError('Payments are not configured yet. See docs/STRIPE_SETUP.md for setup.')
        return
      }
      setError(data.error ?? 'Something went wrong. Please try again.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error. Please try again.')
    } finally {
      setPurchasingPack(null)
    }
  }

  useEffect(() => {
    if (!open) return
    setError(null)
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

  const isLoading = !!purchasingPack

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-credits-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-5xl rounded-2xl border border-border bg-background p-6 shadow-xl max-h-[90vh] overflow-y-auto',
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

        <h2 id="add-credits-title" className="font-heading text-xl md:text-2xl font-semibold text-foreground pr-8 text-center">
          Digital Packs
        </h2>
        <p className="mt-2 text-muted-foreground text-sm md:text-base text-center mb-8">
          Bundle portrait generations and high-res downloads. Sign in required.
        </p>

        {error && (
          <div
            className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Starter Pack */}
          <Card
            className="group flex flex-col h-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary hover:shadow-lg"
            onMouseEnter={() => setHoveredPack('starter')}
            onMouseLeave={() => setHoveredPack(null)}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-heading text-xl md:text-2xl">Starter Pack</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums">
                  <span className="text-lg align-top">$</span>
                  {DIGITAL_PACKS.starter.priceUsd}
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{DIGITAL_PACKS.starter.generations} Portrait Generations</span>
                </li>
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>1 High Res Portrait Download</span>
                </li>
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>Lifetime access to your artworks</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <button
                type="button"
                onClick={() => handlePurchase('starter')}
                disabled={isLoading}
                className={cn(
                  getButtonClassName('secondary', 'lg', 'w-full'),
                  'hover:translate-y-0 hover:bg-primary/90 hover:text-primary-foreground disabled:opacity-70'
                )}
              >
                {purchasingPack === 'starter' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Adding…
                  </span>
                ) : (
                  'Get Starter Pack'
                )}
              </button>
            </CardFooter>
          </Card>

          {/* Creator Pack – featured */}
          <Card
            className={`flex flex-col h-full overflow-hidden transition-all duration-200 ${
              isCreatorDimmed ? 'ring-0' : 'ring-2 ring-primary'
            } hover:shadow-lg`}
            onMouseEnter={() => setHoveredPack('creator')}
            onMouseLeave={() => setHoveredPack(null)}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-heading text-xl md:text-2xl">Creator Pack</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums">
                  <span className="text-lg align-top">$</span>
                  {DIGITAL_PACKS.creator.priceUsd}
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{DIGITAL_PACKS.creator.generations} Portrait Generations</span>
                </li>
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{DIGITAL_PACKS.creator.highResDownloads} High Res Portrait Download</span>
                </li>
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>${DIGITAL_PACKS.creator.pricePerArtwork} per artwork</span>
                </li>
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>Lifetime access</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <button
                type="button"
                onClick={() => handlePurchase('creator')}
                disabled={isLoading}
                className={cn(
                  isCreatorDimmed
                    ? getButtonClassName('secondary', 'lg', 'w-full')
                    : getButtonClassName('default', 'lg', 'w-full'),
                  'hover:translate-y-0 disabled:opacity-70'
                )}
              >
                {purchasingPack === 'creator' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Adding…
                  </span>
                ) : (
                  'Get Creator Pack'
                )}
              </button>
            </CardFooter>
          </Card>

          {/* Artist Pack */}
          <Card
            className="group flex flex-col h-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary hover:shadow-lg"
            onMouseEnter={() => setHoveredPack('artist')}
            onMouseLeave={() => setHoveredPack(null)}
          >
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-heading text-xl md:text-2xl">Artist Pack</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums">
                  <span className="text-lg align-top">$</span>
                  {DIGITAL_PACKS.artist.priceUsd}
                </p>
              </div>
              <ul className="space-y-2.5 text-sm text-foreground">
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{DIGITAL_PACKS.artist.generations} Portrait Generations</span>
                </li>
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{DIGITAL_PACKS.artist.highResDownloads} High Res Portrait Download</span>
                </li>
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>${DIGITAL_PACKS.artist.pricePerArtwork} per artwork</span>
                </li>
                <li className="flex gap-2">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>Lifetime access</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="pt-4">
              <button
                type="button"
                onClick={() => handlePurchase('artist')}
                disabled={isLoading}
                className={cn(
                  getButtonClassName('secondary', 'lg', 'w-full'),
                  'hover:translate-y-0 hover:bg-primary/90 hover:text-primary-foreground disabled:opacity-70'
                )}
              >
                {purchasingPack === 'artist' ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Adding…
                  </span>
                ) : (
                  'Get Artist Pack'
                )}
              </button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )

  return mounted ? createPortal(modal, document.body) : null
}
