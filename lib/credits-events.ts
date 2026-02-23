'use client'

import { useEffect } from 'react'

/**
 * Global event for credits balance updates.
 * When credits are added (modal, dev pack, Stripe webhook callback, etc.),
 * dispatch this event so all UI that displays credits can refetch and update.
 */
const CREDITS_UPDATED_EVENT = 'credits-updated'

export function dispatchCreditsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CREDITS_UPDATED_EVENT))
  }
}

/**
 * Hook that subscribes to credits-updated events and calls onUpdate when fired.
 * Use with fetchCredits or loadBalance to keep UI in sync.
 */
export function useCreditsUpdateListener(onUpdate: () => void): void {
  useEffect(() => {
    const handler = () => onUpdate()
    window.addEventListener(CREDITS_UPDATED_EVENT, handler)
    return () => window.removeEventListener(CREDITS_UPDATED_EVENT, handler)
  }, [onUpdate])
}
