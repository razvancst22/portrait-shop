'use client'

import { Button } from '@/components/primitives/button'
import { Download, Printer } from 'lucide-react'
import type { PreviewPackageVariant } from '@/components/preview/preview-package-modal'

type PortraitActionCardProps = {
  generationId: string
  imageUrl: string | null
  imageAlt: string
  status: string
  onOpenPackageModal: (variant: PreviewPackageVariant) => void
  /** When true, show "Purchased" instead of action buttons (optional). */
  isPurchased?: boolean
  /** 'stack' = buttons stacked vertically (default); 'row' = buttons on same row (e.g. My Portraits section). */
  buttonsLayout?: 'stack' | 'row'
  className?: string
}

/**
 * Same card UI as the preview page: image on top, then Download 4K and Order Print buttons.
 * Used in My Portraits section and My Portraits page.
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
  const completed = status === 'completed'
  const showButtons = completed && !isPurchased

  return (
    <article
      className={`rounded-2xl overflow-hidden bg-card text-card-foreground border border-border shadow-xl flex flex-col min-w-0 ${className}`}
    >
      <a
        href={`/preview/${generationId}`}
        className="relative block w-full aspect-[4/5] overflow-hidden bg-muted select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {imageUrl && completed ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="absolute inset-0 size-full object-cover object-center pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-2">
            {status === 'completed' ? 'No preview' : status === 'failed' ? 'Failed' : 'Creating…'}
          </div>
        )}
      </a>
      <div
        className={
          buttonsLayout === 'row'
            ? 'flex flex-row gap-2 px-3 pt-3 pb-2.5 bg-card border-t border-border shrink-0'
            : 'flex flex-col gap-3 p-4 sm:p-5 bg-card border-t border-border shrink-0'
        }
      >
        {isPurchased ? (
          <p className="text-sm text-muted-foreground text-center py-2">Purchased</p>
        ) : showButtons ? (
          <>
            <Button
              size="lg"
              className={`rounded-xl justify-center shadow-md shadow-primary/25 ${buttonsLayout === 'row' ? 'flex-1 min-w-0 h-11 text-sm gap-1.5 whitespace-nowrap' : 'w-full gap-3 h-12'}`}
              onClick={() => onOpenPackageModal('portrait-pack')}
              title="Download 4K"
            >
              <Download className={buttonsLayout === 'row' ? 'size-4 shrink-0' : 'size-5 shrink-0'} />
              <span>{buttonsLayout === 'row' ? '4K' : 'Download 4K'}</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className={`rounded-xl justify-center ${buttonsLayout === 'row' ? 'flex-1 min-w-0 h-11 text-sm gap-1.5 whitespace-nowrap' : 'w-full gap-3 h-12'}`}
              onClick={() => onOpenPackageModal('art-print-pack')}
              title="Order Print"
            >
              <Printer className={buttonsLayout === 'row' ? 'size-4 shrink-0' : 'size-5 shrink-0'} />
              <span>{buttonsLayout === 'row' ? 'Print' : 'Order Print'}</span>
            </Button>
          </>
        ) : status === 'failed' ? (
          <a
            href="/"
            className="text-sm font-medium text-primary hover:underline text-center block"
          >
            Try again
          </a>
        ) : null}
      </div>
    </article>
  )
}
