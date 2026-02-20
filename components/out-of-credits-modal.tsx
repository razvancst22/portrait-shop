'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { getButtonClassName } from '@/components/primitives/button'
import { cn } from '@/lib/utils'

type OutOfCreditsModalProps = {
  open: boolean
  onClose: () => void
  className?: string
}

/**
 * Modal shown when the user tries to upload with 0 free portraits.
 * Offers Sign up and Buy Portrait Generations.
 */
export function OutOfCreditsModal({ open, onClose, className }: OutOfCreditsModalProps) {
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

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="out-of-credits-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl',
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
        <h2 id="out-of-credits-title" className="font-heading text-xl font-semibold text-foreground pr-8">
          You're out of free portraits
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Sign up to get more free portraits, or buy Portrait Generations to keep creating.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className={getButtonClassName('default', 'lg', 'rounded-full flex-1 text-center')}
          >
            Sign up / Log in
          </Link>
          <Link
            href="/pricing"
            className={getButtonClassName('outline', 'lg', 'rounded-full flex-1 text-center')}
          >
            Buy Portrait Generations
          </Link>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}
