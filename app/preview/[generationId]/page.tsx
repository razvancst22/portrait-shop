'use client'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { Button, getButtonClassName } from '@/components/primitives/button'
import { Card, CardContent } from '@/components/primitives/card'

type StatusResponse = {
  status: string
  previewUrl?: string | null
  progress?: number
  errorMessage?: string | null
}

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const generationId = params.generationId as string
  const [status, setStatus] = useState<string>('generating')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [price, setPrice] = useState<number | null>(null)

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

  const handlePurchase = () => {
    router.push(`/checkout?generationId=${generationId}`)
  }

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
      <div className="py-8 px-4">
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
          <p className="text-muted-foreground text-sm mb-6 rounded-lg bg-muted/50 border border-border px-3 py-2">
            What you see is what you get – the same portrait in high resolution. No re-generation, no surprises.
          </p>
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div
                className="relative aspect-[4/5] select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              >
                <Image
                  src={previewUrl}
                  alt="Your portrait preview"
                  fill
                  className="object-cover pointer-events-none"
                  sizes="(max-width: 640px) 100vw, 512px"
                  unoptimized
                  draggable={false}
                />
              </div>
            </CardContent>
          </Card>
          <Button onClick={handlePurchase} className="w-full rounded-full" size="lg">
            Purchase – ${price ?? 10}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            You’ll complete payment on the next page.
          </p>
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
