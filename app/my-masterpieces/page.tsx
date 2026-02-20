'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { Input } from '@/components/primitives/input'
import { Label } from '@/components/primitives/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ART_STYLE_PROMPTS } from '@/lib/prompts/artStyles'
import type { ArtStyleId } from '@/lib/prompts/artStyles'
import { PortraitActionCard } from '@/components/preview/portrait-action-card'
import { PreviewPackageModal, type PreviewPackageVariant } from '@/components/preview/preview-package-modal'
import { ToastContainer } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type MyGenerationItem = {
  id: string
  art_style: string
  status: string
  preview_image_url: string | null
  is_purchased: boolean
  created_at: string
}

function styleDisplayName(artStyle: string): string {
  const id = artStyle as ArtStyleId
  return ART_STYLE_PROMPTS[id]?.name ?? artStyle
}

function OrderLookupSection() {
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
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
          Order Lookup
        </h3>
        <p className="text-muted-foreground mb-6">
          Enter your order number and email to get a new download link sent to your inbox.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-lg border border-border bg-muted/50 p-4 text-foreground">
          If that order exists, we've sent a new download link to the email you provided.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
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
            className="rounded-full"
            size="lg"
          >
            {loading ? 'Sending…' : 'Send new link'}
          </Button>
        </form>
      )}
    </div>
  )
}

export default function MyOrdersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [generations, setGenerations] = useState<MyGenerationItem[]>([])
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [loadingGenerations, setLoadingGenerations] = useState(true)
  const [packageModal, setPackageModal] = useState<{ generationId: string; variant: PreviewPackageVariant } | null>(null)

  // Check authentication status
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadCredits = useCallback(() => {
    if (!user) return
    setLoadingCredits(true)
    fetch('/api/credits', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setCredits(d.balance ?? null))
      .catch(() => setCredits(null))
      .finally(() => setLoadingCredits(false))
  }, [user])

  const loadGenerations = useCallback(() => {
    if (!user) return
    setLoadingGenerations(true)
    fetch('/api/my-generations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations ?? []))
      .catch(() => setGenerations([]))
      .finally(() => setLoadingGenerations(false))
  }, [user])

  useEffect(() => {
    loadCredits()
    loadGenerations()
  }, [loadCredits, loadGenerations])

  const unpurchasedCount = generations.filter((g) => g.status === 'completed' && !g.is_purchased).length

  // If user is not logged in, show order lookup only
  if (!user) {
    return (
      <div className="px-4 py-12 md:py-16">
        <main className="w-full max-w-3xl mx-auto text-left">
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
          My Masterpieces
        </h1>
        <p className="text-muted-foreground mb-8">
          Look up your order details or sign in to view your portraits.
        </p>
          
          <div className="mb-8">
            <div className="bg-muted/30 rounded-lg p-6 mb-6">
              <p className="text-muted-foreground mb-4">
                Sign in to view your portraits and manage your orders, or use the lookup form below.
              </p>
              <Link href="/login">
                <Button className="rounded-full">Sign In</Button>
              </Link>
            </div>
            <OrderLookupSection />
          </div>

          <p className="mt-8 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to home
            </Link>
          </p>
        </main>
      </div>
    )
  }

  // User is logged in - show full My Orders interface
  return (
    <div className="px-4 py-12 md:py-16">
      <main className="w-full max-w-4xl mx-auto text-left">
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
          My Masterpieces
        </h1>
        <p className="text-muted-foreground mb-6">
          Manage your portraits, orders, and downloads.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="text-sm text-muted-foreground">
            {loadingCredits ? '…' : `${credits ?? 0} Portrait Generations remaining`}
          </span>
          {unpurchasedCount > 0 && (
            <Link href="/cart" className="text-sm font-medium text-primary hover:underline">
              Cart ({unpurchasedCount}) →
            </Link>
          )}
        </div>

        <Tabs defaultValue="portraits" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="portraits">My Portraits</TabsTrigger>
            <TabsTrigger value="lookup">Order Lookup</TabsTrigger>
          </TabsList>

          <TabsContent value="portraits" className="mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="font-heading text-lg font-semibold text-foreground">Your Artwork</h2>
              <Link
                href="/"
                className="text-sm font-medium text-primary hover:underline"
              >
                Create new portrait →
              </Link>
            </div>

            {loadingGenerations ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-start">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="rounded-xl aspect-[4/5]" />
                ))}
              </div>
            ) : generations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
                <p className="text-muted-foreground mb-4">No portraits yet.</p>
                <Link href="/">
                  <Button className="rounded-full">Create your first portrait</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-start">
                {generations.map((gen) => (
                  <PortraitActionCard
                    key={gen.id}
                    generationId={gen.id}
                    imageUrl={gen.preview_image_url}
                    imageAlt={`Portrait in ${styleDisplayName(gen.art_style)} style`}
                    status={gen.status}
                    isPurchased={gen.is_purchased}
                    buttonsLayout="row"
                    onOpenPackageModal={(variant) => setPackageModal({ generationId: gen.id, variant })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lookup" className="mt-0">
            <OrderLookupSection />
          </TabsContent>
        </Tabs>

        <PreviewPackageModal
          open={packageModal !== null}
          onClose={() => setPackageModal(null)}
          variant={packageModal?.variant ?? 'portrait-pack'}
          generationId={packageModal?.generationId ?? ''}
          isPurchased={packageModal ? generations.find(g => g.id === packageModal.generationId)?.is_purchased ?? false : false}
        />
        
        <ToastContainer />

        <p className="mt-8 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  )
}