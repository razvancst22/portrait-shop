'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MyPortraitsContent } from '@/components/my-portraits-content'
import { ToastContainer } from '@/components/ui/toast'

export default function MyPortraitsPage() {
  return (
    <div className="px-4 pt-4 md:pt-6 pb-8 md:pb-12">
      <main className="w-full max-w-3xl mx-auto text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            My Portraits
          </h1>
          <Link href="/" className="text-sm font-medium text-primary hover:underline shrink-0">
            Create new portrait →
          </Link>
        </div>
        <p className="text-muted-foreground mb-6">
          View your creations and purchase high-resolution downloads.
        </p>

        <MyPortraitsContent variant="page" />

        <ToastContainer />
      </main>
    </div>
  )
}
