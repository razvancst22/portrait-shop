'use client'

import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Thank you!</h1>
        <p className="text-zinc-600 mb-6">
          Your payment was successful. We're preparing your digital bundle.
        </p>
        <p className="text-sm text-zinc-500 mb-8">
          You will receive an email with your download link once your bundle is ready.
        </p>
        <p className="text-sm text-zinc-500 mb-6">
          <Link href="/order-lookup" className="text-zinc-900 underline hover:no-underline">
            Lost your link? Get a new one
          </Link>
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-zinc-900 text-white py-3 px-6 font-medium hover:bg-zinc-800"
        >
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
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
