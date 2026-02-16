'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { getButtonClassName } from '@/components/primitives/button'

function CheckoutRedirect() {
  const searchParams = useSearchParams()
  const generationId = searchParams.get('generationId')
  const [status, setStatus] = useState<'redirecting' | 'error' | 'stripe_not_configured' | 'missing'>('redirecting')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!generationId) {
      setStatus('missing')
      return
    }

    let cancelled = false
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ generationId }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (cancelled) return
        if (data.code === 'STRIPE_NOT_CONFIGURED') {
          setStatus('stripe_not_configured')
          return
        }
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
          return
        }
        setStatus('error')
        setErrorMessage(data.error ?? 'Checkout failed')
      })
      .catch((e) => {
        if (cancelled) return
        setStatus('error')
        setErrorMessage(e instanceof Error ? e.message : 'Something went wrong')
      })

    return () => {
      cancelled = true
    }
  }, [generationId])

  if (!generationId || status === 'missing') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">Missing portrait</h1>
          <p className="text-muted-foreground mb-6">
            Please start from your portrait preview or cart to purchase.
          </p>
          <Link href="/my-portraits" className={getButtonClassName('default', 'lg', 'rounded-full')}>
            My portraits
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'stripe_not_configured') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">
            Payments not configured yet
          </h1>
          <p className="text-muted-foreground mb-6">
            Stripe is not set up. To enable checkout, add your Stripe API keys and follow the
            setup guide.
          </p>
          <p className="text-muted-foreground mb-6 text-sm">
            See <strong className="text-foreground">petportrait/docs/STRIPE_SETUP.md</strong> in the project for
            step-by-step instructions.
          </p>
          <Link href={`/preview/${generationId}`} className={getButtonClassName('default', 'lg', 'rounded-full')}>
            Back to preview
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">Checkout failed</h1>
          <p className="text-muted-foreground mb-6" role="alert">
            {errorMessage}
          </p>
          <Link href={`/preview/${generationId}`} className={getButtonClassName('default', 'lg', 'rounded-full')}>
            Back to preview
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary mx-auto mb-4" />
        <h1 className="font-heading text-xl font-semibold text-foreground mb-2">
          Redirecting to Stripe…
        </h1>
        <p className="text-muted-foreground text-sm">
          You’ll enter your email and payment details on Stripe’s secure page.
        </p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      }
    >
      <CheckoutRedirect />
    </Suspense>
  )
}
