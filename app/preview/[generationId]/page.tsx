'use client'

import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { Button, getButtonClassName } from '@/components/primitives/button'
import { Download, Printer } from 'lucide-react'
import { PreviewPackageModal, type PreviewPackageVariant } from '@/components/preview/preview-package-modal'

type StatusResponse = {
  status: string
  previewUrl?: string | null
  progress?: number
  errorMessage?: string | null
}

export default function PreviewPage() {
  const params = useParams()
  const generationId = params.generationId as string
  const [status, setStatus] = useState<string>('generating')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [price, setPrice] = useState<number | null>(null)
  const [packageModal, setPackageModal] = useState<PreviewPackageVariant | null>(null)

  const pollStatus = useCallback(async () => {
    const res = await fetch(`/api/generate/${generationId}/status`)
    if (!res.ok) {
      setStatus('failed')
      setErrorMessage('Could not load status')
      return
    }
    const data: StatusResponse = await res.json()
    setStatus(data.status)
    if (data.previewUrl) setPreviewUrl(data.previewUrl)
    if (data.progress != null) setProgress(data.progress)
    if (data.errorMessage) setErrorMessage(data.errorMessage)
  }, [generationId])

  useEffect(() => {
    pollStatus()
    if (status === 'completed' || status === 'failed') return
    const interval = setInterval(pollStatus, 2000)
    return () => clearInterval(interval)
  }, [pollStatus, status])

  useEffect(() => {
    fetch('/api/pricing')
      .then((r) => r.json())
      .then((d) => setPrice(d.digitalBundlePrice ?? 10))
      .catch(() => setPrice(10))
  }, [])


  if (status === 'failed') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-xl font-semibold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-6">
            {errorMessage ?? 'Generation failed. You can try again.'}
          </p>
          <Link href="/" className={getButtonClassName('default', 'lg', 'rounded-full')}>
            Try again
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    if (!previewUrl) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-muted-foreground">Preparing your preview image…</p>
          </div>
        </div>
      )
    }
    return (
      <div className="py-8 md:py-12 px-4">
        <div className="container max-w-lg mx-auto animate-fade-in">
          <Link href="/" className={getButtonClassName('ghost', 'sm', 'mb-6 rounded-full -ml-2')}>
            ← Back
          </Link>
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            Your preview is ready
          </h1>
          <p className="text-muted-foreground mb-6">
            Love it? Get the full bundle (high-res + wallpapers) for{' '}
            <strong className="text-foreground">${price ?? 10}</strong>.
          </p>

          {/* Single card: image + action buttons */}
          <div className="rounded-2xl overflow-hidden bg-card text-card-foreground border border-border shadow-xl">
            <div
              className="relative aspect-[4/5] w-full select-none bg-muted"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <Image
                src={previewUrl}
                alt="Your portrait preview"
                fill
                className="object-contain pointer-events-none size-full"
                sizes="(max-width: 640px) 100vw, 512px"
                unoptimized
                draggable={false}
              />
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full rounded-xl justify-center gap-3 h-12 shadow-md shadow-primary/25"
                onClick={() => setPackageModal('portrait-pack')}
              >
                <Download className="size-5 shrink-0" />
                <span>Download 4K</span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="w-full rounded-xl justify-center gap-3 h-12"
                onClick={() => setPackageModal('art-print-pack')}
              >
                <Printer className="size-5 shrink-0" />
                <span>Order Print</span>
              </Button>
            </div>
          </div>

          <PreviewPackageModal
            open={packageModal !== null}
            onClose={() => setPackageModal(null)}
            variant={packageModal ?? 'portrait-pack'}
            generationId={generationId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-foreground">Creating your preview…</p>
        <p className="mt-2 text-sm text-muted-foreground">{progress}%</p>
        <p className="mt-4 text-sm text-muted-foreground">
          This usually takes under a minute.
        </p>
      </div>
    </div>
  )
}
