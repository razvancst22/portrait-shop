'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useCreditsUpdateListener } from '@/lib/credits-events'
import { MyPortraitsContent } from '@/components/my-portraits-content'
import { ToastContainer } from '@/components/ui/toast'

export default function MyPortraitsPage() {
  const [credits, setCredits] = useState<number | null>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)

  const loadCredits = useCallback(() => {
    setLoadingCredits(true)
    fetch('/api/credits', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setCredits(d.balance ?? null))
      .catch(() => setCredits(null))
      .finally(() => setLoadingCredits(false))
  }, [])

  useEffect(() => {
    loadCredits()
  }, [loadCredits])

  useCreditsUpdateListener(loadCredits)

  return (
    <div className="px-4 py-8 md:py-12">
      <main className="w-full max-w-3xl mx-auto text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
          My Portraits
        </h1>
        <p className="text-muted-foreground mb-6">
          View your creations and purchase high-resolution downloads.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span className="text-sm text-muted-foreground">
            {loadingCredits ? '…' : `${credits ?? 0} Portrait Generations remaining`}
          </span>
          <Link href="/create" className="text-sm font-medium text-primary hover:underline">
            Create new portrait →
          </Link>
        </div>

        <MyPortraitsContent variant="page" showCreateLink={true} />

        <ToastContainer />
      </main>
    </div>
  )
}
