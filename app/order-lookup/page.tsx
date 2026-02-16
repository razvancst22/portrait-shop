'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, getButtonClassName } from '@/components/primitives/button'
import { Input } from '@/components/primitives/input'
import { Label } from '@/components/primitives/label'
import { PageContainer } from '@/components/layout/page-container'

export default function OrderLookupPage() {
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
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer maxWidth="sm" padding="md" className="animate-fade-in">
        <Link href="/" className={getButtonClassName('ghost', 'sm', 'mb-6 rounded-full -ml-2')}>
          ← Back to home
        </Link>
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">Get a new download link</h1>
        <p className="text-muted-foreground mb-6">
          Enter your order number and email. We’ll send a new download link to your inbox.
        </p>

        {submitted ? (
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-foreground">
            If that order exists, we’ve sent a new download link to the email you provided.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="orderNumber">Order number</Label>
              <Input
                id="orderNumber"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-ABC123"
                className="mt-1.5"
              />
            </div>
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full"
              size="lg"
            >
              {loading ? 'Sending…' : 'Send new link'}
            </Button>
          </form>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/" className="text-foreground underline hover:no-underline">
            Back to home
          </Link>
        </p>
    </PageContainer>
  )
}
