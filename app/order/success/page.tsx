'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { getButtonClassName } from '@/components/primitives/button'

function SuccessContent() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">Thank you!</h1>
        <p className="text-muted-foreground mb-6">
          Your payment was successful. We're preparing your digital bundle.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          You will receive an email with your download link once your bundle is ready.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          <Link href="/order-lookup" className="text-foreground underline hover:no-underline">
            Lost your link? Get a new one
          </Link>
        </p>
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
