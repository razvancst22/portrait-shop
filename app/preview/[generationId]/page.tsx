'use client'

import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { getButtonClassName } from '@/components/primitives/button'
import { Check, Download, Loader2 } from 'lucide-react'
import { PreviewUpgradeOptions } from '@/components/preview/preview-upgrade-options'
import { CountdownOfferBanner } from '@/components/preview/countdown-offer-banner'
import { ToastContainer, showToast } from '@/components/ui/toast'
import { GET_YOUR_PORTRAIT_PRICE_USD, GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD } from '@/lib/pricing/constants'

const GENERATING_MESSAGES = [
  'Analyzing your photo…',
  'Studying the composition…',
  'Mixing colors on the palette…',
  'Adding artistic flair…',
  'Bringing your portrait to life…',
  'Adding the finishing touches…',
  'Almost there…',
  'Just a moment longer…',
]

type StatusResponse = {
  status: string
  previewUrl?: string | null
  progress?: number
  errorMessage?: string | null
  isPurchased?: boolean
}

const DISPLAY_WIDTH = 1200

export default function PreviewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const generationId = params.generationId as string

  // Optimistic state when navigating from grid with ?completed=1&purchased=0|1
  const optimisticCompleted = searchParams.get('completed') === '1'
  const optimisticPurchased = searchParams.get('purchased') === '1'

  const [status, setStatus] = useState<string | null>(optimisticCompleted ? 'completed' : null)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [statusMessageIndex, setStatusMessageIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [price, setPrice] = useState<number>(GET_YOUR_PORTRAIT_PRICE_USD)
  const [discountActive, setDiscountActive] = useState<boolean>(false)
  const [discountExpiresAt, setDiscountExpiresAt] = useState<number | undefined>()
  const [isPurchased, setIsPurchased] = useState<boolean>(optimisticCompleted ? optimisticPurchased : false)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)

  const displayedPrice = discountActive ? GET_YOUR_PORTRAIT_DISCOUNT_PRICE_USD : price

  // Derive image URL from id - no wait for API; image can start loading immediately
  const displayImageUrl = useMemo(() => {
    if (status !== 'completed') return null
    return isPurchased
      ? `/api/generate/${generationId}/final?w=${DISPLAY_WIDTH}`
      : `/api/generate/${generationId}/preview?w=${DISPLAY_WIDTH}`
  }, [status, isPurchased, generationId])

  const pollStatus = useCallback(async () => {
    const res = await fetch(`/api/generate/${generationId}/status`)
    if (!res.ok) {
      setStatus('failed')
      setErrorMessage('Could not load status')
      return
    }
    const data: StatusResponse = await res.json()
    setStatus(data.status)
    if (data.isPurchased != null) setIsPurchased(data.isPurchased)
    if (data.progress != null) setDisplayProgress(data.progress)
    if (data.errorMessage) setErrorMessage(data.errorMessage)
  }, [generationId])

  useEffect(() => {
    pollStatus()
    if (status === 'completed' || status === 'failed') return
    const interval = setInterval(pollStatus, 1500)
    return () => clearInterval(interval)
  }, [pollStatus, status])

  // Simulated progress: advance from current toward 92% while waiting (or use API progress)
  useEffect(() => {
    if (status !== 'generating') return
    const interval = setInterval(() => {
      setDisplayProgress((p) => {
        if (p >= 92) return p
        return Math.min(92, p + (92 - p) * 0.05)
      })
    }, 320)
    return () => clearInterval(interval)
  }, [status])

  // Rotate status messages every 2.5s
  useEffect(() => {
    if (status !== 'generating') return
    const interval = setInterval(() => {
      setStatusMessageIndex((i) => (i + 1) % GENERATING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    if (status !== 'completed') return
    fetch(`/api/pricing?generationId=${encodeURIComponent(generationId)}`)
      .then((r) => r.json())
      .then((d) => {
        setPrice(d.getYourPortraitPrice ?? GET_YOUR_PORTRAIT_PRICE_USD)
        setDiscountActive(!!d.discountActive)
        if (d.expiresAt != null) setDiscountExpiresAt(d.expiresAt)
      })
      .catch(() => {})
  }, [status, generationId])

  const handleDownload = useCallback(() => {
    if (!isPurchased || status !== 'completed') return
    setIsDownloading(true)
    showToast.loading('Preparing your portrait download...')
    fetch(`/api/download/${generationId}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Download failed: ${response.status}`)
        return response.json()
      })
      .then((data) => {
        if (data.downloadUrl) {
          showToast.success('Download ready! Redirecting...')
          setTimeout(() => {
            window.location.href = data.downloadUrl
          }, 500)
        }
      })
      .catch((error) => {
        console.error(error)
        showToast.error('Download failed. Please try again.')
      })
      .finally(() => setIsDownloading(false))
  }, [generationId, isPurchased, status])


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
    if (!displayImageUrl) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-muted-foreground">Preparing your image…</p>
          </div>
        </div>
      )
    }
    return (
      <div className="py-8 md:py-12 px-4">
        <div className="container max-w-2xl mx-auto animate-fade-in">
          <Link href="/" className={getButtonClassName('ghost', 'sm', 'mb-6 rounded-full -ml-2')}>
            ← Back
          </Link>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4 ${
              isPurchased
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isPurchased ? (
              <>
                <Check className="size-3.5 stroke-[2.5]" aria-hidden />
                Purchased
              </>
            ) : (
              'Preview'
            )}
          </span>
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
            {isPurchased ? 'You own this portrait' : 'Preview your portrait'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isPurchased ? (
              'Download your high-resolution portrait or order a museum-quality print.'
            ) : (
              <>
                Love it? Upgrade to get the digital 4K file or order a premium print—see options below.
              </>
            )}
          </p>

          {!isPurchased && discountActive && discountExpiresAt != null && (
            <CountdownOfferBanner expiresAt={discountExpiresAt} className="mb-4" />
          )}

          {/* Image card - image-driven layout, no cropping */}
          <div className="mx-auto max-w-md rounded-2xl overflow-hidden bg-card text-card-foreground border border-border shadow-xl">
            <div
              className="relative w-full select-none bg-muted/20"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <img
                src={displayImageUrl ?? ''}
                alt={isPurchased ? "Your portrait" : "Your portrait preview"}
                className="block w-full h-auto pointer-events-none object-contain"
                draggable={false}
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>

          {isPurchased ? (
            /* Purchased: Download button under photo + Order Print pricing card */
            <>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={getButtonClassName('default', 'lg', 'rounded-xl gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700')}
                >
                  {isDownloading ? (
                    <>
                      <div className="size-5 animate-spin rounded-full border-2 border-background border-t-transparent shrink-0" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Download className="size-5 shrink-0" />
                      Download
                    </>
                  )}
                </button>
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Order a museum-quality print
                </p>
                <PreviewUpgradeOptions
                  generationId={generationId}
                  isPurchased={true}
                  getYourPortraitPrice={displayedPrice}
                  discountActive={discountActive}
                  onDownload={handleDownload}
                  isDownloading={isDownloading}
                  showOnlyPrintCard
                />
              </div>
            </>
          ) : (
            /* Unpurchased: full upgrade options */
            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Choose how you&apos;d like to enjoy your portrait
              </p>
              <PreviewUpgradeOptions
                generationId={generationId}
                isPurchased={isPurchased}
                getYourPortraitPrice={displayedPrice}
                discountActive={discountActive}
                onDownload={handleDownload}
                isDownloading={isDownloading}
              />
            </div>
          )}
          <ToastContainer />
        </div>
      </div>
    )
  }

  const showProgress = Math.round(displayProgress)
  const circumference = 2 * Math.PI * 24
  const strokeDashoffset = circumference - (showProgress / 100) * circumference

  // Unknown status (initial load, no optimistic params): minimal loading state
  if (status === null) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-8">
        <Loader2 className="size-10 animate-spin text-primary mb-4" aria-hidden />
        <p className="text-muted-foreground">Loading portrait…</p>
      </div>
    )
  }

  // Actually generating: full Creating UI
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-8">
      <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary animate-pulse">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Creating…
      </span>
      <div className="text-center space-y-6">
        {/* Circular progress: SVG ring that fills as we advance */}
        <div className="relative mx-auto h-14 w-14">
          <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56" aria-hidden>
            <circle
              className="text-muted"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              cx="28"
              cy="28"
              r="24"
            />
            <circle
              className="text-primary transition-all duration-500 ease-out"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              cx="28"
              cy="28"
              r="24"
            />
          </svg>
          {/* Subtle spin overlay when progress is low */}
          {showProgress < 30 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-foreground font-medium">Creating your preview…</p>
          <p
            key={statusMessageIndex}
            className="text-sm text-muted-foreground min-h-[1.25rem] animate-fade-in"
          >
            {GENERATING_MESSAGES[statusMessageIndex]}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums text-foreground">{showProgress}%</p>
          <p className="text-xs text-muted-foreground">
            This usually takes under a minute.
          </p>
        </div>
      </div>
    </div>
  )
}
