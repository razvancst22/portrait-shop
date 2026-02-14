'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/primitives/button'
import { getButtonClassName } from '@/components/primitives/button'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_ROUTES, SUBJECT_TYPE_IDS } from '@/lib/prompts/artStyles'

const FOCUSABLE = 'a[href], button:not([disabled])'

export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const categoriesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
      const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false)
      document.addEventListener('keydown', onEscape)
      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', onEscape)
      }
    }
  }, [drawerOpen])

  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (drawerOpen && panelRef.current) {
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      const first = focusables[0]
      if (first) first.focus()
    } else if (prevOpenRef.current && !drawerOpen && menuButtonRef.current) {
      menuButtonRef.current.focus()
    }
    prevOpenRef.current = drawerOpen
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen || !panelRef.current) return
    const panel = panelRef.current
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    panel.addEventListener('keydown', onKeyDown)
    return () => panel.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)

  useEffect(() => {
    if (!categoriesOpen) return
    const onOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false)
      }
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [categoriesOpen])

  const categorySubLinks = SUBJECT_TYPE_IDS.map((id) => (
    <Link
      key={id}
      href={CATEGORY_ROUTES[id].path}
      className="block w-full rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
      onClick={() => setCategoriesOpen(false)}
    >
      {CATEGORY_ROUTES[id].title}
    </Link>
  ))

  const navLinks = (
    <>
      <div className="relative" ref={categoriesRef}>
        <Button
          type="button"
          variant="ghost"
          size="default"
          className="rounded-full"
          onClick={() => setCategoriesOpen((o) => !o)}
          aria-expanded={categoriesOpen}
          aria-haspopup="true"
          aria-label="Portrait categories"
        >
          All categories
        </Button>
        {categoriesOpen && (
          <div
            className="absolute left-0 top-full mt-1 min-w-[200px] rounded-lg border border-border bg-background py-2 shadow-lg z-50"
            role="menu"
          >
            {categorySubLinks}
          </div>
        )}
      </div>
      <Link href="/pet-portraits" className={getButtonClassName('default', 'default', 'rounded-full')}>
        Pet portraits
      </Link>
      <Link href="/order-lookup" className={getButtonClassName('ghost', 'default', 'rounded-full')}>
        Order lookup
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-4xl mx-auto items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading text-lg font-semibold text-foreground hover:text-primary transition-colors"
        >
          petportrait.shop
        </Link>

        <nav className="hidden md:flex items-center gap-2" aria-label="Main">
          {navLinks}
        </nav>

        {/* Mobile: custom drawer */}
        <Button
          ref={menuButtonRef}
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Drawer overlay + panel */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            aria-hidden
            onClick={closeDrawer}
          />
          <div
            ref={panelRef}
            className={cn(
              'fixed inset-y-0 right-0 z-50 w-[280px] max-w-[85vw] flex flex-col gap-4 border-l border-border bg-background p-6 pt-8 shadow-lg md:hidden',
              'animate-in slide-in-from-right duration-300'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
          >
            <Link
              href="/"
              className="font-heading text-lg font-semibold text-foreground"
              onClick={closeDrawer}
            >
              petportrait.shop
            </Link>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mt-2">
                Portraits
              </span>
              {SUBJECT_TYPE_IDS.map((id) => (
                <Link
                  key={id}
                  href={CATEGORY_ROUTES[id].path}
                  className={cn(getButtonClassName('outline', 'lg'), 'rounded-full justify-start')}
                  onClick={closeDrawer}
                >
                  {CATEGORY_ROUTES[id].title}
                </Link>
              ))}
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mt-4">
                Other
              </span>
              <Link
                href="/"
                className={cn(getButtonClassName('ghost', 'lg'), 'rounded-full justify-start')}
                onClick={closeDrawer}
              >
                All categories (home)
              </Link>
              <Link
                href="/order-lookup"
                className={cn(getButtonClassName('outline', 'lg'), 'rounded-full justify-start')}
                onClick={closeDrawer}
              >
                Order lookup
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
