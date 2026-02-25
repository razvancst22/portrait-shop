'use client'

import { useState } from 'react'
import { Button } from '@/components/primitives/button'
import { Check, Download, Printer } from 'lucide-react'
import type { PreviewPackageVariant } from '@/components/preview/preview-package-modal'
import { showToast } from '@/components/ui/toast'

type PortraitActionCardProps = {
  generationId: string
  imageUrl: string | null
  imageAlt: string
  status: string
  onOpenPackageModal: (variant: PreviewPackageVariant) => void
  /** When true, use final image instead of watermarked preview */
  isPurchased?: boolean
  /** 'stack' = buttons stacked vertically (default); 'row' = buttons on same row (e.g. My Portraits section). */
  buttonsLayout?: 'stack' | 'row'
  className?: string
}

/**
 * Beautiful portrait card with floating overlay buttons that appear on hover.
 * Features a modern design with buttons positioned over the bottom of the photo,
 * creating an elegant Pinterest-like aesthetic. Used in My Portraits section and page.
 */
export function PortraitActionCard({
  generationId,
  imageUrl,
  imageAlt,
  status,
  onOpenPackageModal,
  isPurchased = false,
  buttonsLayout = 'stack',
  className = '',
}: PortraitActionCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const completed = status === 'completed'
  const showButtons = completed
  
  // Use final image for purchased items, preview for unpurchased
  const displayImageUrl = isPurchased && completed 
    ? `/api/generate/${generationId}/final` 
    : imageUrl

  return (
    <article
      className={`relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-black/25 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 min-w-0 group cursor-pointer touch-manipulation ${className}`}
    >
      <a
        href={`/preview/${generationId}`}
        className={`relative block w-full overflow-hidden bg-gradient-to-br from-muted/30 to-muted select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${!(displayImageUrl && completed) ? 'aspect-[4/5]' : ''}`}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {displayImageUrl && completed ? (
          <>
            <img
              src={displayImageUrl}
              alt={imageAlt}
              className="block w-full h-auto pointer-events-none transition-all duration-700 group-hover:scale-105 group-hover:brightness-105"
              draggable={false}
            />
            {/* Subtle always-visible gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            {/* Status badge: Purchased (green check) or Preview (muted pill) */}
            {isPurchased ? (
              <div
                className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-md"
                aria-label="Purchased"
              >
                <Check className="size-3.5 stroke-[2.5]" />
              </div>
            ) : (
              <span
                className="absolute top-2 right-2 rounded-full bg-black/40 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-white/90"
                aria-label="Preview"
              >
                Preview
              </span>
            )}
            {/* Enhanced gradient overlay on hover for button readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm p-4 bg-gradient-to-br from-muted/60 to-muted/40 backdrop-blur-sm">
            <div className="text-center">
              <div className="font-medium mb-1">
                {status === 'completed' ? 'No preview available' : status === 'failed' ? 'Generation failed' : 'Creating your portrait...'}
              </div>
              {status === 'generating' && (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              )}
            </div>
          </div>
        )}

        {/* Floating Action Buttons */}
        {showButtons && (
          <div
            className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 ${
              buttonsLayout === 'row'
                ? 'flex flex-row gap-1.5 sm:gap-2'
                : 'flex flex-col gap-2 sm:gap-2.5'
            } transition-all duration-500 transform translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0`}
          >
            <Button
              size={buttonsLayout === 'row' ? 'sm' : 'default'}
              className={`backdrop-blur-xl bg-green-500 hover:bg-green-600 text-white border border-green-600/30 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 font-semibold hover:scale-105 ${
                buttonsLayout === 'row' 
                  ? 'flex-1 h-8 sm:h-9 text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-full px-3 sm:px-4' 
                  : 'w-full h-10 sm:h-11 text-sm sm:text-base gap-2 sm:gap-2.5 rounded-full px-4 sm:px-6'
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (isPurchased) {
                  setIsDownloading(true)
                  showToast.loading('Preparing your portrait download...')
                  
                  fetch(`/api/download/${generationId}`)
                    .then(response => {
                      if (!response.ok) throw new Error(`Download failed: ${response.status}`)
                      return response.json()
                    })
                    .then(data => {
                      if (data.downloadUrl) {
                        showToast.success('Download ready! Redirecting...')
                        setTimeout(() => {
                          window.location.href = data.downloadUrl
                        }, 500)
                      }
                    })
                    .catch(error => {
                      console.error(error)
                      showToast.error('Download failed. Please try again.')
                    })
                    .finally(() => setIsDownloading(false))
                } else {
                  onOpenPackageModal('portrait-pack')
                }
              }}
              disabled={isDownloading}
              title={isPurchased ? "Download Your Portrait" : "Download 4K"}
            >
              {isDownloading ? (
                <div className={`animate-spin rounded-full border-2 border-white border-t-transparent shrink-0 ${buttonsLayout === 'row' ? 'size-3 sm:size-3.5' : 'size-4 sm:size-5'}`} />
              ) : (
                <Download className={buttonsLayout === 'row' ? 'size-3 sm:size-3.5 shrink-0' : 'size-4 sm:size-5 shrink-0'} />
              )}
              <span className="font-semibold">
                {isDownloading 
                  ? (buttonsLayout === 'row' ? 'Loading' : 'Loading...')
                  : (buttonsLayout === 'row' ? '4K' : 'Download 4K')
                }
              </span>
            </Button>
            
            <Button
              variant="secondary"
              size={buttonsLayout === 'row' ? 'sm' : 'default'}
              className={`backdrop-blur-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 border border-yellow-600/30 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 font-medium hover:scale-105 ${
                buttonsLayout === 'row' 
                  ? 'flex-1 h-8 sm:h-9 text-xs sm:text-sm gap-1 sm:gap-1.5 rounded-full px-3 sm:px-4' 
                  : 'w-full h-10 sm:h-11 text-sm sm:text-base gap-2 sm:gap-2.5 rounded-full px-4 sm:px-6'
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onOpenPackageModal('art-print-pack')
              }}
              title="Order Print"
            >
              <Printer className={buttonsLayout === 'row' ? 'size-3 sm:size-3.5 shrink-0' : 'size-4 sm:size-5 shrink-0'} />
              <span className="font-semibold">{buttonsLayout === 'row' ? 'Print' : 'Order Print'}</span>
            </Button>
          </div>
        )}

        {/* Failed state overlay */}
        {status === 'failed' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <a
              href="/"
              className="bg-white/95 hover:bg-white text-gray-900 px-6 py-3 rounded-full font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 backdrop-blur-xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              Try again
            </a>
          </div>
        )}
      </a>
    </article>
  )
}