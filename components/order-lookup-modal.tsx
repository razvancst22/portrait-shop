'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/primitives/button'
import { Input } from '@/components/primitives/input'
import { Label } from '@/components/primitives/label'
import { cn } from '@/lib/utils'

type OrderLookupModalProps = {
  open: boolean
  onClose: () => void
  /** Called when lookup succeeds – e.g. refresh orders list */
  onSuccess?: () => void
  className?: string
}

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

/**
 * Modal for order lookup – enter order number and email to get a new download link.
 */
export function OrderLookupModal({ open, onClose, onSuccess, className }: OrderLookupModalProps) {
  const mounted = useMounted()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber.trim() || !email.trim()) return
    setLoading(true)
    setSubmitted(false)
    try {
      await fetch('/api/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      })
      setSubmitted(true)
      onSuccess?.()
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

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
      aria-labelledby="order-lookup-title"
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

        <h2 id="order-lookup-title" className="font-heading text-xl font-semibold text-foreground pr-8">
          Get a new download link
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your order number and email. We&apos;ll send a new download link to your inbox.
        </p>

        {submitted ? (
          <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-foreground">
            If that order exists, we&apos;ve sent a new download link to the email you provided.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="order-lookup-order-number">Order number</Label>
              <Input
                id="order-lookup-order-number"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-ABC123"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="order-lookup-email">Email</Label>
              <Input
                id="order-lookup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full" size="lg">
              {loading ? 'Sending…' : 'Send new link'}
            </Button>
          </form>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="mt-4 w-full rounded-full"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )

  return mounted ? createPortal(modal, document.body) : null
}
