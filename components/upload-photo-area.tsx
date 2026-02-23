'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Palette, ImagePlus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type UploadPhotoAreaWrapperAs = 'label' | 'button' | 'div' | 'link'

export type UploadPhotoAreaProps = {
  /** Left slot: e.g. "1 Portrait Generation" with icon */
  creditsCount: number | null
  creditsLabel?: string
  /** Right slot: e.g. "Pick Style" link or button */
  pickStyleLabel?: string
  pickStyleHref?: string
  onPickStyle?: () => void
  /** Alternative right slot: custom component (e.g. StyleSelector) */
  styleSelector?: React.ReactNode
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
  /** Accessibility: disabled when no Portrait Generations */
  disabled?: boolean
  /** When creditsCount is 0, called when user clicks Add Credits. Enables alternating slot. */
  onAddCredits?: () => void
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

const ADD_CREDITS_ALTERNATE_INTERVAL_MS = 3000

function useAlternatingSlot(active: boolean): boolean {
  const [showButton, setShowButton] = useState(false)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      setShowButton((prev) => !prev)
    }, ADD_CREDITS_ALTERNATE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [active])
  return showButton
}

export function UploadPhotoArea({
  creditsCount,
  creditsLabel = 'Portrait Generation',
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
  onAddCredits,
  children,
  styleSelector,
}: UploadPhotoAreaProps) {
  const showAddCreditsButton = useAlternatingSlot(
    creditsCount === 0 && !!onAddCredits
  )
  const subtitleMessages = Array.isArray(subtitle) ? subtitle : [subtitle]
  const rotatingSubtitle = useRotatingMessage(
    subtitleMessages,
    subtitleRotateIntervalMs
  )
  const displaySubtitle = Array.isArray(subtitle)
    ? rotatingSubtitle
    : subtitle

  const containerClass = cn(
    'flex flex-col min-h-[200px] w-full p-4 sm:p-6 transition-all duration-300 ease-out',
    'glass-liquid glass-liquid-soft glass-liquid-hover',
    'outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    isDragOver && '!bg-primary/20 !border-primary/40 scale-[1.02] shadow-[0_0_0_2px_var(--primary)]',
    disabled && 'opacity-70 cursor-not-allowed hover:translate-y-0 hover:!scale-100',
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
    ...(as === 'button' && {
      role: 'button' as const,
      tabIndex: 0,
      onClick,
      onKeyDown: (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault()
          ;(onClick as (e: React.MouseEvent) => void)(e as unknown as React.MouseEvent)
        }
      },
    }),
    ...(as === 'link' && { href, role: 'link' as const }),
  }

  const inner = (
    <>
      {/* Top row: tokens left, pick style right */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-4">
        <div className="flex items-center gap-1 sm:gap-1.5 text-sm text-muted-foreground min-h-[1.5rem] min-w-0 flex-1">
          {creditsCount === 0 && onAddCredits && showAddCreditsButton ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAddCredits()
              }}
              className={cn(
                'glass-red inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
                'shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 animate-in fade-in duration-300'
              )}
            >
              <Sparkles className="size-5 shrink-0" aria-hidden />
              <span>Add Credits</span>
            </button>
          ) : (
            <>
              <Sparkles className="size-4 text-primary/80 shrink-0" aria-hidden />
              <span
                key={`credits-${creditsCount ?? 'loading'}`}
                className="font-medium text-foreground animate-in fade-in duration-300 break-words"
              >
                {creditsCount !== null
                  ? `${creditsCount} ${creditsCount === 1 ? creditsLabel : creditsLabel + 's'}`
                  : '…'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {styleSelector ? (
            <div
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              {styleSelector}
            </div>
          ) : pickStyleHref ? (
            <a
              href={pickStyleHref}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              <Palette className="size-4 shrink-0 text-primary/80" aria-hidden />
              <span className="font-medium">{pickStyleLabel}</span>
            </a>
          ) : onPickStyle ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPickStyle()
              }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              <Palette className="size-4 shrink-0 text-primary/80" aria-hidden />
              <span className="font-medium">{pickStyleLabel}</span>
            </button>
          ) : pickStyleLabel ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
              <Palette className="size-4 shrink-0 text-primary/80" aria-hidden />
              <span className="font-medium">{pickStyleLabel}</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Center: upload icon, title, subtitle */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative mb-2 sm:mb-3">
          <div className="flex items-center justify-center size-16 rounded-2xl bg-white/20 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/15 text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_2px_8px_-2px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_8px_-2px_rgba(0,0,0,0.3)]">
            <ImagePlus className="size-8" aria-hidden strokeWidth={1.5} />
          </div>
          <span
            className="absolute -top-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-bold shadow-lg shadow-primary/30 border border-white/20"
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
    return <div {...wrapperProps}>{inner}</div>
  }
  if (as === 'link') {
    return <a {...wrapperProps}>{inner}</a>
  }
  return <div {...wrapperProps}>{inner}</div>
}