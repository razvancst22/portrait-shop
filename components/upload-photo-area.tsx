'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Palette, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type UploadPhotoAreaWrapperAs = 'label' | 'button' | 'div' | 'link'

export type UploadPhotoAreaProps = {
  /** Left slot: e.g. "1 Credit" with icon */
  creditsCount: number | null
  creditsLabel?: string
  /** Right slot: e.g. "Pick Style" link or button */
  pickStyleLabel?: string
  pickStyleHref?: string
  onPickStyle?: () => void
  /** Center content */
  uploadTitle: string
  /** Subtitle text, or array of messages to rotate through */
  subtitle: string | string[]
  /** If subtitle is an array, rotate every N ms. 0 = show first only */
  subtitleRotateIntervalMs?: number
  /** Wrapper element type */
  as: UploadPhotoAreaWrapperAs
  /** For as="label": id of the file input */
  htmlFor?: string
  href?: string
  onClick?: (e: React.MouseEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  /** Extra class for the outer container */
  className?: string
  /** Drag-over state when used as drop zone */
  isDragOver?: boolean
  /** Accessibility: disabled when no credits */
  disabled?: boolean
  children?: React.ReactNode
}

function useRotatingMessage(messages: string[], intervalMs: number): string {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (messages.length <= 1 || intervalMs <= 0) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [messages.length, intervalMs])
  return messages[index] ?? ''
}

export function UploadPhotoArea({
  creditsCount,
  creditsLabel = 'Credit',
  pickStyleLabel = 'Pick Style',
  pickStyleHref,
  onPickStyle,
  uploadTitle,
  subtitle,
  subtitleRotateIntervalMs = 0,
  as,
  htmlFor,
  href,
  onClick,
  onKeyDown,
  onDrop,
  onDragOver,
  onDragLeave,
  className,
  isDragOver = false,
  disabled = false,
  children,
}: UploadPhotoAreaProps) {
  const subtitleMessages = Array.isArray(subtitle) ? subtitle : [subtitle]
  const rotatingSubtitle = useRotatingMessage(
    subtitleMessages,
    subtitleRotateIntervalMs
  )
  const displaySubtitle = Array.isArray(subtitle)
    ? rotatingSubtitle
    : subtitle

  const containerClass = cn(
    'flex flex-col min-h-[200px] w-full rounded-2xl border-2 border-dashed p-6 transition-all duration-200',
    'border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10 hover:shadow-lg hover:-translate-y-0.5',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    isDragOver && 'border-primary bg-primary/15',
    disabled && 'opacity-80 cursor-not-allowed hover:translate-y-0',
    className
  )

  const canDrop = as === 'label' || as === 'div'
  const wrapperProps = {
    className: containerClass,
    ...(canDrop ? { onDrop, onDragOver, onDragLeave } : {}),
    ...(as === 'label' && {
      htmlFor: disabled ? undefined : htmlFor,
      role: 'button' as const,
      tabIndex: 0,
      ...(onClick && { onClick }),
      ...(onKeyDown && { onKeyDown }),
    }),
    ...(as === 'button' && { type: 'button' as const, onClick, role: 'button' as const, tabIndex: 0 }),
    ...(as === 'link' && { href, role: 'link' as const }),
  }

  const inner = (
    <>
      {/* Top row: tokens left, pick style right */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary/80" aria-hidden />
          <span className="font-medium text-foreground">
            {creditsCount !== null
              ? `${creditsCount} ${creditsCount === 1 ? creditsLabel : creditsLabel + 's'}`
              : '…'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {pickStyleHref ? (
            <a
              href={pickStyleHref}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Palette className="size-4 text-primary/80" aria-hidden />
              <span className="font-medium">{pickStyleLabel}</span>
            </a>
          ) : onPickStyle ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPickStyle()
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Palette className="size-4 text-primary/80" aria-hidden />
              <span className="font-medium">{pickStyleLabel}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Palette className="size-4 text-primary/80" aria-hidden />
              <span className="font-medium">{pickStyleLabel}</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: upload icon, title, subtitle */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-3">
          <div className="flex items-center justify-center size-14 rounded-xl bg-muted/80 text-muted-foreground">
            <ImagePlus className="size-7" aria-hidden />
          </div>
          <span
            className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
            aria-hidden
          >
            +
          </span>
        </div>
        <span className="font-semibold text-foreground text-lg">
          {uploadTitle}
        </span>
        <span
          key={displaySubtitle}
          className="text-sm text-muted-foreground mt-1 min-h-[1.25rem] animate-in fade-in duration-300"
        >
          {displaySubtitle}
        </span>
        {children}
      </div>
    </>
  )

  if (as === 'label') {
    return <label {...wrapperProps}>{inner}</label>
  }
  if (as === 'button') {
    return <button {...wrapperProps}>{inner}</button>
  }
  if (as === 'link') {
    return <a {...wrapperProps}>{inner}</a>
  }
  return <div {...wrapperProps}>{inner}</div>
}
