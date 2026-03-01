'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Download, ArrowLeft, Package, ExternalLink, Sparkles, Receipt, Truck, RotateCcw } from 'lucide-react'
import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { PageContainer } from '@/components/layout/page-container'

type OrderDetail = {
  order: {
    id: string
    orderNumber: string
    createdAt: string
    status: string
    totalUsd: number
    fulfillmentStatus: string | null
    trackingNumber: string | null
    trackingUrl: string | null
  }
  items: Array<{
    id: string
    productType: string
    generationId: string | null
    unitPriceUsd: number
    quantity: number
    subtotalUsd: number
    previewImageUrl: string | null
    finalImageUrl: string | null
    artStyle: string | null
  }>
  downloadUrl: string | null
  receiptUrl: string | null
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  get_your_portrait: 'Get your Portrait',
  art_print: 'Art Print Pack',
  digital_pack_starter: 'Starter Pack',
  digital_pack_creator: 'Creator Pack',
  digital_pack_artist: 'Artist Pack',
}

function productTypeLabel(productType: string): string {
  return PRODUCT_TYPE_LABELS[productType] ?? productType.replace(/_/g, ' ')
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

function Step({
  done,
  active,
  label,
}: { done?: boolean; active?: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
      <div
        className={`size-2 rounded-full shrink-0 ${
          done ? 'bg-primary' : active ? 'bg-primary/60' : 'bg-muted'
        }`}
      />
      <span
        className={`text-xs truncate max-w-full ${
          done || active ? 'text-foreground font-medium' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params?.orderId as string | undefined
  const [data, setData] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('Invalid order')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    fetch(`/api/my-orders/${orderId}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) return null
          throw new Error(res.status === 404 ? 'Order not found' : 'Failed to load order')
        }
        return res.json()
      })
      .then((d) => {
        setData(d)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false))
  }, [orderId])

  if (!orderId) {
    return (
      <PageContainer maxWidth="lg" padding="lg" className="flex flex-col items-center">
        <p className="text-muted-foreground">Invalid order.</p>
        <Link href="/account" className="mt-4 text-primary hover:underline">
          ← Back to account
        </Link>
      </PageContainer>
    )
  }

  if (loading) {
    return (
      <PageContainer maxWidth="lg" padding="lg" className="flex flex-col items-center">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </PageContainer>
    )
  }

  if (error || !data) {
    return (
      <PageContainer maxWidth="lg" padding="lg" className="flex flex-col items-center">
        <p className="text-muted-foreground">{error ?? 'Order not found.'}</p>
        <Link href="/account" className="mt-4 text-primary hover:underline">
          ← Back to account
        </Link>
      </PageContainer>
    )
  }

  const { order, items, downloadUrl, receiptUrl } = data
  const hasPhysicalItems = items.some((i) => i.productType === 'art_print')
  const isShipped = order.fulfillmentStatus === 'shipped'

  return (
    <PageContainer maxWidth="lg" padding="lg" className="flex flex-col items-center">
      <div className="w-full max-w-2xl text-left space-y-6">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to account
        </Link>

        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-1">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            · {statusLabel(order.status)}
          </p>
        </div>

        {/* Order status timeline */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 text-sm">
            <Step done label="Order placed" />
            <Step done={order.status !== 'pending_payment'} label="Paid" />
            <Step
              done={isShipped || order.status === 'delivered'}
              active={order.status === 'paid' && !isShipped && order.status !== 'delivered'}
              label={hasPhysicalItems ? 'Processing' : 'Preparing'}
            />
            <Step
              done={order.status === 'delivered'}
              active={isShipped && order.status !== 'delivered'}
              label="Complete"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="size-5" />
            Items
          </h2>
          <ul className="space-y-4">
            {items.map((item) => {
              const previewUrl = item.generationId
                ? `/api/generate/${item.generationId}/preview?w=200`
                : null
              const previewHref = item.generationId
                ? `/preview/${item.generationId}?completed=1&purchased=1`
                : null
              const isPack = ['digital_pack_starter', 'digital_pack_creator', 'digital_pack_artist'].includes(item.productType)

              return (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-border bg-background/50 p-4"
                >
                  {previewHref ? (
                    <Link
                      href={previewHref}
                      className="group block w-20 aspect-[4/5] shrink-0 rounded-lg overflow-hidden bg-muted ring-2 ring-transparent hover:ring-primary/50 transition-all duration-200 hover:scale-[1.02]"
                      title="View portrait preview"
                    >
                      <img
                        src={previewUrl!}
                        alt={productTypeLabel(item.productType)}
                        className="size-full object-cover object-center"
                        loading="lazy"
                        decoding="async"
                      />
                    </Link>
                  ) : isPack ? (
                    <Link
                      href="/account"
                      className="group flex w-20 aspect-[4/5] shrink-0 rounded-lg bg-muted items-center justify-center ring-2 ring-transparent hover:ring-primary/50 transition-all duration-200 hover:scale-[1.02]"
                      title="View in account"
                    >
                      <Sparkles className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ) : (
                    <div className="w-20 aspect-[4/5] shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="size-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p className="font-medium text-foreground">
                      {productTypeLabel(item.productType)}
                      {item.artStyle && (
                        <span className="text-muted-foreground font-normal">
                          {' '}
                          · {item.artStyle.replace(/_/g, ' ')}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${item.unitPriceUsd.toFixed(2)}
                      {item.quantity > 1 && ` × ${item.quantity} = $${item.subtotalUsd.toFixed(2)}`}
                    </p>
                    {previewHref && (
                      <Link
                        href={previewHref}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
                      >
                        <ExternalLink className="size-3.5" />
                        View portrait preview
                      </Link>
                    )}
                    {isPack && !previewHref && (
                      <Link
                        href="/account"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-1"
                      >
                        <ExternalLink className="size-3.5" />
                        View in account
                      </Link>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="font-semibold text-foreground">
                Total: ${order.totalUsd.toFixed(2)}
              </p>
              <div className="flex flex-wrap gap-2">
                {downloadUrl && (
                  <Link href={downloadUrl}>
                    <Button className="rounded-full gap-2">
                      <Download className="size-4" />
                      Download
                    </Button>
                  </Link>
                )}
                {receiptUrl && (
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-full gap-2">
                      <Receipt className="size-4" />
                      View receipt
                    </Button>
                  </a>
                )}
                {isShipped && order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="rounded-full gap-2">
                      <Truck className="size-4" />
                      Track shipment
                    </Button>
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Link
                href={`/contact?refund=1&order=${encodeURIComponent(order.orderNumber)}`}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-4" />
                Request refund
              </Link>
              <Link
                href="/refunds"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                Refund policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
