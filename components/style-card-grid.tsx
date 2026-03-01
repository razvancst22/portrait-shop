'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/primitives/card'
import { getArtStylesWithColors, type ArtStyleWithColors } from '@/lib/prompts/artStyles'

interface StyleCardGridProps {
  selectedStyle?: string
  onStyleSelect: (styleId: string) => void
  disabled?: boolean
  className?: string
}

/** Placeholder gradient when example image is missing – uses style palette */
function StyleCardImage({ style }: { style: ArtStyleWithColors }) {
  const { primary, secondary, background } = style.colors
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 50%, ${background} 100%)`,
      }}
    />
  )
}

export function StyleCardGrid({
  selectedStyle,
  onStyleSelect,
  disabled = false,
  className,
}: StyleCardGridProps) {
  const [styles, setStyles] = useState<ArtStyleWithColors[]>([])

  useEffect(() => {
    setStyles(getArtStylesWithColors())
  }, [])

  if (styles.length === 0) return null

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4', className)}>
      {styles.map((style) => {
        const isSelected = selectedStyle === style.id
        return (
          <Card
            key={style.id}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={isSelected}
            onClick={() => !disabled && onStyleSelect(style.id)}
            onKeyDown={(e) => !disabled && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onStyleSelect(style.id))}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:border-primary/60 hover:shadow-md p-0 overflow-hidden',
              disabled && 'opacity-60 cursor-not-allowed',
              isSelected && 'ring-2 ring-primary border-primary shadow-md'
            )}
          >
            <CardContent className="p-0">
              <div className="aspect-[4/5] relative w-full overflow-hidden bg-muted">
                <StyleCardImage style={style} />
                <Image
                  src={style.exampleImageUrl}
                  alt={style.name}
                  fill
                  className="object-cover object-center size-full"
                  sizes="(max-width: 640px) 50vw, 25vw"
                  loading="lazy"
                  unoptimized
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 shrink-0">
                    <div
                      className="size-2.5 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: style.colors.primary }}
                      aria-hidden
                    />
                    <div
                      className="size-2.5 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: style.colors.secondary }}
                      aria-hidden
                    />
                    <div
                      className="size-2.5 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: style.colors.background }}
                      aria-hidden
                    />
                  </div>
                  <span className="font-medium text-foreground text-sm truncate flex-1 min-w-0">{style.name}</span>
                  {isSelected && (
                    <Check className="size-4 text-primary shrink-0" aria-hidden />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
