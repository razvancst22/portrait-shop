'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import {
  CATEGORY_ROUTES,
  SUBJECT_TYPE_IDS,
  type SubjectTypeId,
} from '@/lib/prompts/artStyles'

interface CategoryDropdownProps {
  currentCategory: SubjectTypeId
  disabled?: boolean
  className?: string
}

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export function CategoryDropdown({
  currentCategory,
  disabled = false,
  className,
}: CategoryDropdownProps) {
  const router = useRouter()
  const mounted = useMounted()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const handleSelect = (id: SubjectTypeId) => {
    const path = CATEGORY_ROUTES[id]?.path
    if (path) router.push(path)
    setIsOpen(false)
  }

  useEffect(() => {
    if (!isOpen) return
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false)
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [isOpen])

  const dropdown = mounted && isOpen && createPortal(
    <>
      <div
        className="fixed inset-0 z-40"
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
      />
      <div
        role="listbox"
        aria-label="Portrait type"
        className={cn(
          'fixed z-50 mt-1 min-w-[200px] overflow-hidden rounded-xl',
          'border border-border bg-card shadow-xl',
          'py-1.5'
        )}
        style={{
          top: triggerRef.current ? triggerRef.current.getBoundingClientRect().bottom + 4 : 0,
          left: triggerRef.current ? triggerRef.current.getBoundingClientRect().left : 0,
        }}
      >
        {SUBJECT_TYPE_IDS.map((id) => {
          const isSelected = currentCategory === id
          return (
            <button
              key={id}
              role="option"
              aria-selected={isSelected}
              type="button"
              onClick={() => handleSelect(id)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium',
                'text-foreground bg-transparent',
                'hover:bg-muted/80 focus:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                'transition-colors'
              )}
            >
              <span>{CATEGORY_ROUTES[id].title}</span>
              {isSelected && (
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
              )}
            </button>
          )
        })}
      </div>
    </>,
    document.body
  )

  return (
    <div className={cn('relative shrink-0', className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Portrait type: ${CATEGORY_ROUTES[currentCategory].title}`}
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-xl h-8 pl-3 pr-3 min-w-[140px]',
          'bg-muted/50 dark:bg-muted/30 backdrop-blur-sm border border-border',
          'text-sm font-medium text-foreground',
          'hover:bg-muted/70 dark:hover:bg-muted/50',
          'shadow-sm hover:shadow-md transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0'
        )}
      >
        <span className="truncate">{CATEGORY_ROUTES[currentCategory].title}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
          aria-hidden
        />
      </button>
      {dropdown}
    </div>
  )
}
