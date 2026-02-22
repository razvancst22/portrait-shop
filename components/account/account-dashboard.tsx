'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Star, Download, RefreshCw, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { cn } from '@/lib/utils'


type MyOrderItem = {
  id: string
  order_number: string
  created_at: string
  status: string
  total_usd: number
  downloadUrl: string
}

export function AccountDashboard() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [orders, setOrders] = useState<MyOrderItem[]>([])

  const loadCredits = useCallback(() => {
    setLoadingCredits(true)
    fetch('/api/credits', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setCredits(d.balance ?? null))
      .catch(() => setCredits(null))
      .finally(() => setLoadingCredits(false))
  }, [])

  const loadOrders = useCallback(() => {
    setLoadingOrders(true)
    fetch('/api/my-orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false))
  }, [])

  useEffect(() => {
    loadCredits()
    loadOrders()
  }, [loadCredits, loadOrders])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadCredits()
    })
    return () => subscription.unsubscribe()
  }, [loadCredits])

  return (
    <div className="w-full max-w-3xl mx-auto text-left">
      <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-6">
        My Account
      </h1>

      <p className="text-muted-foreground mb-6">
        Manage your plan, orders, and downloads.
      </p>

      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">Your Plan:</p>
        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
          Free
        </span>
        <div className="flex flex-wrap gap-6 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Star className="size-4 text-primary/80" />
            {loadingCredits ? '…' : `${credits ?? 0} Portrait Generations remaining`}
          </span>
          <span className="flex items-center gap-2">
            <Download className="size-4 text-primary/80" />
            {loadingOrders ? '…' : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-heading text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Package className="size-5" />
          Order History
        </h2>
        {loadingOrders ? (
          <div className="space-y-2">
            <div className="rounded-xl border border-border bg-muted/30 h-14 animate-pulse" />
            <div className="rounded-xl border border-border bg-muted/30 h-14 animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Orders placed while logged in, or with the same email as your account, will appear here.
            </p>
            <Link
              href="/order-lookup"
              className="text-sm font-medium text-primary hover:underline"
            >
              Lost your link? Look up an order by order number and email →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()} · ${order.total_usd.toFixed(2)}
                  </p>
                </div>
                <Link
                  href={order.downloadUrl}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline shrink-0"
                >
                  <Download className="size-4" />
                  Download
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => { loadCredits(); loadOrders(); }}
          disabled={loadingCredits || loadingOrders}
        >
          <RefreshCw className={cn('size-4', (loadingCredits || loadingOrders) && 'animate-spin')} />
          Refresh
        </Button>
        <Link href="/my-portraits" className="text-sm font-medium text-primary hover:underline">
          View your portraits →
        </Link>
      </div>

      <p className="mt-8 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}
