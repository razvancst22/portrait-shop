'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, Download, RefreshCw, Package, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCreditsUpdateListener } from '@/lib/credits-events'
import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { ART_STYLE_PROMPTS } from '@/lib/prompts/artStyles'
import type { ArtStyleId } from '@/lib/prompts/artStyles'
import { PortraitActionCard } from '@/components/preview/portrait-action-card'
import { PreviewPackageModal, type PreviewPackageVariant } from '@/components/preview/preview-package-modal'
import { ToastContainer } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

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

type BalanceBreakdown = {
  freeGenerationsRemaining: number
  packGenerationsRemaining: number
  packDownloadsRemaining: number
  totalCredits: number
  packTypes: string[]
}

type MyOrderItem = {
  id: string
  order_number: string
  created_at: string
  status: string
  total_usd: number
  downloadUrl: string
}

export function AccountDashboard() {
  const [balance, setBalance] = useState<BalanceBreakdown | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingGenerations, setLoadingGenerations] = useState(true)
  const [orders, setOrders] = useState<MyOrderItem[]>([])
  const [generations, setGenerations] = useState<MyGenerationItem[]>([])
  const [packageModal, setPackageModal] = useState<{ generationId: string; variant: PreviewPackageVariant } | null>(null)

  const loadBalance = useCallback(() => {
    setLoadingBalance(true)
    fetch('/api/account/balance', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) =>
        setBalance({
          freeGenerationsRemaining: d.freeGenerationsRemaining ?? 0,
          packGenerationsRemaining: d.packGenerationsRemaining ?? 0,
          packDownloadsRemaining: d.packDownloadsRemaining ?? 0,
          totalCredits: d.totalCredits ?? 0,
          packTypes: d.packTypes ?? [],
        })
      )
      .catch(() => setBalance(null))
      .finally(() => setLoadingBalance(false))
  }, [])

  const loadOrders = useCallback(() => {
    setLoadingOrders(true)
    fetch('/api/my-orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false))
  }, [])

  const loadGenerations = useCallback(() => {
    setLoadingGenerations(true)
    fetch('/api/my-generations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations ?? []))
      .catch(() => setGenerations([]))
      .finally(() => setLoadingGenerations(false))
  }, [])

  useEffect(() => {
    loadBalance()
    loadOrders()
    loadGenerations()
  }, [loadBalance, loadOrders, loadGenerations])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadBalance()
      loadGenerations()
    })
    return () => subscription.unsubscribe()
  }, [loadBalance, loadGenerations])

  useCreditsUpdateListener(loadBalance)

  const totalCredits = balance?.totalCredits ?? 0
  const packDownloads = balance?.packDownloadsRemaining ?? 0

  return (
    <div className="w-full max-w-3xl mx-auto text-left space-y-8">
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
          My Account
        </h1>
        <p className="text-muted-foreground">
          Manage your plan, portrait credits, and order history.
        </p>
      </div>

      {/* Credits cards - glassmorphism */}
      <div className="grid grid-cols-2 gap-4">
        {/* Portrait Generations */}
        <div
          className={cn(
            'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
            'border border-border/50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Sparkles className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Portrait Generations
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {loadingBalance ? '…' : totalCredits}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {loadingBalance
              ? '…'
              : !balance
                ? '—'
                : balance.freeGenerationsRemaining > 0 && balance.packGenerationsRemaining > 0
                  ? `${balance.freeGenerationsRemaining} free + ${balance.packGenerationsRemaining} from packs`
                  : balance.packGenerationsRemaining > 0
                    ? 'From Digital Packs'
                    : balance.freeGenerationsRemaining > 0
                      ? 'Free tier'
                      : 'Add credits to create more'}
          </p>
        </div>

        {/* Portrait Downloads */}
        <div
          className={cn(
            'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
            'border border-border/50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Download className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Portrait Downloads
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {loadingBalance ? '…' : packDownloads}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            High‑res downloads from Digital Packs
          </p>
        </div>
      </div>

      {/* My Portraits */}
      <div
        className={cn(
          'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
          'border border-border/50'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Palette className="size-5" />
            My Portraits
          </h2>
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
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
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
      </div>

      {/* Order History */}
      <div
        className={cn(
          'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
          'border border-border/50'
        )}
      >
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Package className="size-5" />
          Order History
        </h2>
        {loadingOrders ? (
          <div className="space-y-3">
            <div className="h-14 rounded-xl bg-muted/30 animate-pulse" />
            <div className="h-14 rounded-xl bg-muted/30 animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Orders placed while logged in, or with the same email, will appear here.
            </p>
            <Link
              href="/order-lookup"
              className="text-sm font-medium text-primary hover:underline"
            >
              Look up an order by order number and email →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border/60 bg-background/50 p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} · $
                    {order.total_usd.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    View details
                  </Link>
                  <Link
                    href={order.downloadUrl}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Download className="size-4" />
                    Download
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => {
            loadBalance()
            loadOrders()
            loadGenerations()
          }}
          disabled={loadingBalance || loadingOrders || loadingGenerations}
        >
          <RefreshCw className={cn('size-4', (loadingBalance || loadingOrders || loadingGenerations) && 'animate-spin')} />
          Refresh
        </Button>
        <Link
          href="/my-portraits"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all portraits →
        </Link>
        <Link
          href="/pricing"
          className="text-sm font-medium text-primary hover:underline"
        >
          Buy more credits →
        </Link>
        <Link
          href="/order-lookup"
          className="text-sm font-medium text-primary hover:underline"
        >
          Order lookup →
        </Link>
      </div>

      <PreviewPackageModal
        open={packageModal !== null}
        onClose={() => setPackageModal(null)}
        variant={packageModal?.variant ?? 'portrait-pack'}
        generationId={packageModal?.generationId ?? ''}
        isPurchased={packageModal ? generations.find(g => g.id === packageModal.generationId)?.is_purchased ?? false : false}
      />
      <ToastContainer />

      <p className="text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}
