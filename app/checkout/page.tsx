'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useRef, Suspense } from 'react'
import { getButtonClassName } from '@/components/primitives/button'

function CheckoutRedirect() {
  const searchParams = useSearchParams()
  const generationId = searchParams.get('generationId')
  const useDiscount = searchParams.get('useDiscount') === 'true'
  const pack = searchParams.get('pack')
  const print = searchParams.get('print')

  const hasGenerationFlow = !!generationId
  const hasPackFlow = pack === 'starter' || pack === 'creator' || pack === 'artist'

  const [status, setStatus] = useState<'redirecting' | 'error' | 'stripe_not_configured' | 'missing' | 'sign_in_required'>('redirecting')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const initiatedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!hasGenerationFlow && !hasPackFlow) {
      setStatus('missing')
      return
    }

    const requestKey = hasPackFlow ? `pack-${pack}` : `gen-${generationId}-${print ?? ''}-${useDiscount}`
    if (initiatedRef.current === requestKey) return
    initiatedRef.current = requestKey

    let cancelled = false
    const body: Record<string, unknown> = hasPackFlow
      ? { pack }
      : {
          generationId,
          useDiscount,
          ...(print && { print }),
        }
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (cancelled) return
        if (data.code === 'STRIPE_NOT_CONFIGURED') {
          setStatus('stripe_not_configured')
          return
        }
        if (data.code === 'SIGN_IN_REQUIRED') {
          setStatus('sign_in_required')
          return
        }
        if (data.bypass) {
          if (data.downloadUrl) {
            window.location.href = data.downloadUrl
          } else if (hasPackFlow) {
            window.location.href = '/account'
          } else {
            window.location.href = '/order/success'
          }
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
  }, [generationId, useDiscount, pack, print, hasGenerationFlow, hasPackFlow])

  if (status === 'sign_in_required') {
    const returnUrl = `/checkout?pack=${pack ?? ''}`
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md w-full text-center rounded-xl border border-border bg-card p-6">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">
            Digital Packs require an account. Sign in to continue your purchase.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(returnUrl)}`}
            className={getButtonClassName('default', 'lg', 'rounded-full')}
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'missing') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md w-full text-center rounded-xl border border-border bg-card p-6">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">Missing product</h1>
          <p className="text-muted-foreground mb-6">
            Please start from the pricing page or your portrait preview to purchase.
          </p>
          <Link href="/pricing" className={getButtonClassName('default', 'lg', 'rounded-full')}>
            View pricing
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'stripe_not_configured') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md w-full text-center rounded-xl border border-border bg-card p-6">
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
          <Link
            href={generationId ? `/preview/${generationId}` : '/pricing'}
            className={getButtonClassName('default', 'lg', 'rounded-full')}
          >
            {generationId ? 'Back to preview' : 'Back to pricing'}
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md w-full text-center rounded-xl border border-border bg-card p-6">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">Checkout failed</h1>
          <p className="text-muted-foreground mb-6" role="alert">
            {errorMessage}
          </p>
          <Link
            href={generationId ? `/preview/${generationId}` : '/pricing'}
            className={getButtonClassName('default', 'lg', 'rounded-full')}
          >
            {generationId ? 'Back to preview' : 'Back to pricing'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-xl border border-border bg-card p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary mx-auto mb-4" />
        <h1 className="font-heading text-xl font-semibold text-foreground mb-2">
          {hasPackFlow ? 'Preparing your pack…' : 'Redirecting to payment…'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {hasPackFlow
            ? 'Adding credits or redirecting to secure checkout.'
            : "You'll enter your email and payment details on our secure payment page."}
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
