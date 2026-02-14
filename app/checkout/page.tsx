'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { Button, getButtonClassName } from '@/components/primitives/button'
import { Input } from '@/components/primitives/input'
import { Label } from '@/components/primitives/label'

function CheckoutForm() {
  const searchParams = useSearchParams()
  const generationId = searchParams.get('generationId')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripeNotConfigured, setStripeNotConfigured] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!generationId || !email.trim()) return
    setLoading(true)
    setError(null)
    setStripeNotConfigured(false)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId, email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 503 && data.code === 'STRIPE_NOT_CONFIGURED') {
        setStripeNotConfigured(true)
        return
      }
      if (!res.ok) {
        setError(data.error ?? 'Checkout failed')
        return
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }
      setError('No checkout URL returned')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!generationId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">Missing preview</h1>
          <p className="text-muted-foreground mb-6">
            Please start from your portrait preview to purchase.
          </p>
          <Link href="/" className={getButtonClassName('default', 'lg', 'rounded-full')}>
            Create a portrait
          </Link>
        </div>
      </div>
    )
  }

  if (stripeNotConfigured) {
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

  return (
    <div className="py-8 px-4">
      <div className="container max-w-md mx-auto animate-fade-in">
        <Link href={`/preview/${generationId}`} className={getButtonClassName('ghost', 'sm', 'mb-6 rounded-full -ml-2')}>
          ← Back to preview
        </Link>
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-6">
          Enter your email. You’ll complete payment securely on Stripe ($10).
        </p>
        <p className="text-muted-foreground text-sm mb-6 rounded-lg bg-muted/50 border border-border px-3 py-2">
          You'll receive the same portrait you saw – in high resolution, no surprises.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full"
            size="lg"
          >
            {loading ? 'Redirecting to payment…' : 'Continue to payment'}
          </Button>
        </form>
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
      <CheckoutForm />
    </Suspense>
  )
}
