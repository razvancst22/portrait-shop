'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Palette, X } from 'lucide-react'
import { Button } from '@/components/primitives/button'
import { getArtStylesWithColors, type ArtStyleWithColors } from '@/lib/prompts/artStyles'

interface StyleSelectorProps {
  selectedStyle?: string
  onStyleSelect: (styleId: string) => void
  disabled?: boolean
  className?: string
}

export function StyleSelector({ 
  selectedStyle, 
  onStyleSelect, 
  disabled = false,
  className = "" 
}: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [styles, setStyles] = useState<ArtStyleWithColors[]>([])

  useEffect(() => {
    setStyles(getArtStylesWithColors())
  }, [])

  const selectedStyleData = styles.find(style => style.id === selectedStyle)

  return (
    <div className={`relative ${className}`}>
      {/* Style Pick Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="gap-2 text-muted-foreground hover:text-foreground"
        title="Pick style"
      >
        <Palette className="size-4" />
        <span>Pick Style</span>
      </Button>

      {/* Style Selector Modal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="style-modal-title"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Modal */}
          <div 
            className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="style-modal-title" className="font-semibold text-lg text-foreground">Choose Style</h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {styles.map((styleOption) => (
                <button
                  key={styleOption.id}
                  onClick={() => {
                    onStyleSelect(styleOption.id)
                    setIsOpen(false)
                  }}
                  className="w-full p-3 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 text-left group hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex gap-1">
                          <div 
                            className="size-3 rounded-full border border-border/50"
                            style={{ backgroundColor: styleOption.colors.primary }}
                          />
                          <div 
                            className="size-3 rounded-full border border-border/50"
                            style={{ backgroundColor: styleOption.colors.secondary }}
                          />
                          <div 
                            className="size-3 rounded-full border border-border/50"
                            style={{ backgroundColor: styleOption.colors.background }}
                          />
                        </div>
                        <span className="font-medium text-foreground">
                          {styleOption.name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {styleOption.description}
                      </p>
                    </div>
                    
                    {selectedStyle === styleOption.id && (
                      <div className="text-primary">
                        <Check className="size-4" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {selectedStyleData ? 
                  `${selectedStyleData.name} style selected` : 
                  'Select a style to continue'
                }
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export function StyleSelectorCompact({ 
  selectedStyle, 
  onStyleSelect, 
  disabled = false 
}: StyleSelectorProps) {
  const [styles, setStyles] = useState<ArtStyleWithColors[]>([])

  useEffect(() => {
    setStyles(getArtStylesWithColors())
  }, [])

  const selectedStyleData = styles.find(style => style.id === selectedStyle)

  return (
    <div className="flex items-center gap-2">
      <Palette className="size-4 text-muted-foreground" />
      <select
        value={selectedStyle || ''}
        onChange={(e) => onStyleSelect(e.target.value)}
        disabled={disabled}
        className="bg-transparent border-none text-sm text-foreground focus:outline-none cursor-pointer"
      >
        <option value="">Choose style...</option>
        {styles.map((style) => (
          <option key={style.id} value={style.id}>
            {style.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function StylePreviewCard({ styleId }: { styleId: string }) {
  const [styles, setStyles] = useState<ArtStyleWithColors[]>([])

  useEffect(() => {
    setStyles(getArtStylesWithColors())
  }, [])
  
  const styleData = styles.find(s => s.id === styleId)
  
  if (!styleData) return null

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1">
          <div 
            className="size-4 rounded-full border border-border/50"
            style={{ backgroundColor: styleData.colors.primary }}
          />
          <div 
            className="size-4 rounded-full border border-border/50"
            style={{ backgroundColor: styleData.colors.secondary }}
          />
          <div 
            className="size-4 rounded-full border border-border/50"
            style={{ backgroundColor: styleData.colors.background }}
          />
        </div>
        <h3 className="font-medium text-foreground">{styleData.name}</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        {styleData.description}
      </p>
      
      {/* Mini Color Preview */}
      <div className="space-y-2">
        <div 
          className="h-6 rounded border border-border/50"
          style={{ backgroundColor: styleData.colors.background }}
        />
        <div className="flex gap-2">
          <div 
            className="h-4 flex-1 rounded border border-border/50"
            style={{ backgroundColor: styleData.colors.primary }}
          />
          <div 
            className="h-4 flex-1 rounded border border-border/50"
            style={{ backgroundColor: styleData.colors.secondary }}
          />
        </div>
      </div>
    </div>
  )
}