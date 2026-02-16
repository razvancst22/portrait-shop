'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button, getButtonClassName } from '@/components/primitives/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 animate-fade-in">
      <div className="max-w-md text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-8">
          An unexpected error occurred. You can try again or go back to the home page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="rounded-full" size="lg">
            Try again
          </Button>
          <Link href="/" className={getButtonClassName('outline', 'lg', 'rounded-full')}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
