'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Download, ArrowLeft, Package } from 'lucide-react'
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

  const { order, items, downloadUrl } = data

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

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="size-5" />
            Items
          </h2>
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 rounded-xl border border-border bg-background/50 p-4"
              >
                {item.generationId ? (
                  <Link
                    href={`/preview/${item.generationId}`}
                    className="block w-20 aspect-[4/5] shrink-0 rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={`/api/generate/${item.generationId}/preview`}
                      alt=""
                      className="size-full object-contain object-center"
                    />
                  </Link>
                ) : (
                  <div className="w-20 aspect-[4/5] shrink-0 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
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
                </div>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="font-semibold text-foreground">
              Total: ${order.totalUsd.toFixed(2)}
            </p>
            {downloadUrl && (
              <Link href={downloadUrl}>
                <Button className="rounded-full gap-2">
                  <Download className="size-4" />
                  Download
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
