'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { dispatchCreditsUpdated } from '@/lib/credits-events'
import { getButtonClassName } from '@/components/primitives/button'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    dispatchCreditsUpdated()
  }, [])

  useEffect(() => {
    if (!sessionId) return
    fetch(`/api/order-from-session?session_id=${encodeURIComponent(sessionId)}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d) => d.orderId && setOrderId(d.orderId))
      .catch(() => {})
  }, [sessionId])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">Thank you!</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was successful. We're preparing your digital bundle.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          You will receive an email with your download link once your bundle is ready.
        </p>
        <div className="flex flex-col gap-3 mb-6">
          {orderId && (
            <Link
              href={`/account/orders/${orderId}`}
              className={getButtonClassName('default', 'md', 'rounded-full')}
            >
              View your order
            </Link>
          )}
          <p className="text-sm text-muted-foreground">
            <Link href="/order-lookup" className="text-foreground underline hover:no-underline">
              Lost your link? Get a new one
            </Link>
          </p>
        </div>
        <Link href="/" className={getButtonClassName('default', 'lg', 'rounded-full')}>
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
