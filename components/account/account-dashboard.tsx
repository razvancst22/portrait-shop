'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, Download, Package, Plus, Search, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { useCreditsUpdateListener } from '@/lib/credits-events'
import { Skeleton } from '@/components/primitives/skeleton'
import { MyPortraitsContent } from '@/components/my-portraits-content'
import { AddCreditsModal } from '@/components/add-credits-modal'
import { OrderLookupModal } from '@/components/order-lookup-modal'
import { ToastContainer } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

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
  downloadUrl?: string
}

export function AccountDashboard() {
  const [balance, setBalance] = useState<BalanceBreakdown | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [orders, setOrders] = useState<MyOrderItem[]>([])
  const [addCreditsModalOpen, setAddCreditsModalOpen] = useState(false)
  const [orderLookupModalOpen, setOrderLookupModalOpen] = useState(false)

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

  const { user } = useAuth()

  useEffect(() => {
    loadBalance()
    loadOrders()
  }, [loadBalance, loadOrders])

  useEffect(() => {
    loadBalance()
  }, [loadBalance, user])

  useCreditsUpdateListener(loadBalance)

  const totalCredits = balance?.totalCredits ?? 0
  const packDownloads = balance?.packDownloadsRemaining ?? 0

  return (
    <div className="w-full max-w-3xl mx-auto text-left space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
            My Account
          </h1>
          <p className="text-muted-foreground">
            Manage your plan, portrait credits, and order history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddCreditsModalOpen(true)}
          className="glass-green inline-flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="size-4" />
          Add Credits
        </button>
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

      {/* My Portraits – shared with /my-portraits page */}
      <div
        className={cn(
          'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
          'border border-border/50'
        )}
      >
        <MyPortraitsContent variant="embedded" />
      </div>

      {/* Order History */}
      <div
        className={cn(
          'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
          'border border-border/50'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="size-5" />
            Order History
          </h2>
          <button
            type="button"
            onClick={() => setOrderLookupModalOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline shrink-0"
          >
            <Search className="size-4" />
            Order lookup
          </button>
        </div>
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
                  {order.downloadUrl && (
                    <Link
                      href={order.downloadUrl}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      <Download className="size-4" />
                      Download
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddCreditsModal
        open={addCreditsModalOpen}
        onClose={() => setAddCreditsModalOpen(false)}
        isLoggedIn={true}
        onCreditsAdded={loadBalance}
      />
      <OrderLookupModal
        open={orderLookupModalOpen}
        onClose={() => setOrderLookupModalOpen(false)}
        onSuccess={loadOrders}
      />
      <ToastContainer />
    </div>
  )
}
