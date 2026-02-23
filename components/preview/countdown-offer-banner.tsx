'use client'

import { useEffect, useState } from 'react'
import { GET_YOUR_PORTRAIT_PRICE_USD, GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD } from '@/lib/pricing/constants'

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

type CountdownOfferBannerProps = {
  expiresAt: number
  onExpired?: () => void
  className?: string
}

/**
 * Shows 33% off offer: $14.99 → $9.99 with countdown timer.
 * Updates every second; calls onExpired when timer reaches 0.
 */
export function CountdownOfferBanner({ expiresAt, onExpired, className = '' }: CountdownOfferBannerProps) {
  const [remaining, setRemaining] = useState(() => Math.max(0, expiresAt - Date.now()))

  useEffect(() => {
    if (remaining <= 0) {
      onExpired?.()
      return
    }
    const interval = setInterval(() => {
      const next = Math.max(0, expiresAt - Date.now())
      setRemaining(next)
      if (next <= 0) onExpired?.()
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, remaining, onExpired])

  if (remaining <= 0) return null

  return (
    <div
      className={`rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-foreground">
        <span className="text-primary font-semibold">33% off</span> – ${GET_YOUR_PORTRAIT_PRICE_USD} → $
        {GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD}
      </p>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        Offer ends in {formatTimeRemaining(remaining)}
      </p>
    </div>
  )
}
