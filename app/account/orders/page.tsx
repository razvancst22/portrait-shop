'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Package, Search, Download, ArrowLeft, ChevronRight } from 'lucide-react'
import { OrderLookupModal } from '@/components/order-lookup-modal'
import { PageContainer } from '@/components/layout/page-container'
import { cn } from '@/lib/utils'

type MyOrderItem = {
  id: string
  order_number: string
  created_at: string
  status: string
  total_usd: number
  downloadUrl?: string
}

function statusLabel(status: string): string {
  switch (status) {
    case 'delivered':
      return 'Delivered'
    case 'paid':
      return 'Paid'
    case 'pending_payment':
      return 'Pending payment'
    case 'processing':
      return 'Processing'
    default:
      return status.replace(/_/g, ' ')
  }
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabel(status)
  const variant =
    status === 'delivered'
      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
      : status === 'paid'
        ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
        : status === 'processing'
          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
          : 'bg-muted text-muted-foreground'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant
      )}
    >
      {label}
    </span>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<MyOrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [orderLookupModalOpen, setOrderLookupModalOpen] = useState(false)

  const loadOrders = useCallback(() => {
    setLoading(true)
    fetch('/api/my-orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  return (
    <PageContainer maxWidth="lg" padding="lg" className="flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto text-left space-y-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="size-4" />
          Back to account
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
              Order History
            </h1>
            <p className="text-muted-foreground">
              View your orders and download your portraits.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOrderLookupModalOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline shrink-0"
          >
            <Search className="size-4" />
            Order lookup
          </button>
        </div>

        <div
          className={cn(
            'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
            'border border-border/50'
          )}
        >
          {loading ? (
            <div className="space-y-3">
              <div className="h-14 rounded-xl bg-muted/30 animate-pulse" />
              <div className="h-14 rounded-xl bg-muted/30 animate-pulse" />
              <div className="h-14 rounded-xl bg-muted/30 animate-pulse" />
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <Package className="mx-auto size-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                No orders yet.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Orders placed while logged in, or with the same email, will appear here.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Create your first portrait
                <ChevronRight className="size-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{order.order_number}</p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString()} · $
                        {order.total_usd.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      View details
                      <ChevronRight className="size-4" />
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
      </div>

      <OrderLookupModal
        open={orderLookupModalOpen}
        onClose={() => setOrderLookupModalOpen(false)}
        onSuccess={loadOrders}
      />
    </PageContainer>
  )
}
