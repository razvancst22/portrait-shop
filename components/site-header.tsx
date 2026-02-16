'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/primitives/button'
import { getButtonClassName } from '@/components/primitives/button'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_ROUTES, SUBJECT_TYPE_IDS } from '@/lib/prompts/artStyles'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const FOCUSABLE = 'a[href], button:not([disabled])'

export function SiteHeader() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    closeDrawer()
    router.push('/')
    router.refresh()
  }

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

  const drawerContent =
    drawerOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]"
              aria-hidden
              onClick={closeDrawer}
            />
            <div
              ref={panelRef}
              className={cn(
                'fixed inset-y-0 right-0 z-[100] w-[280px] max-w-[85vw] flex flex-col gap-4 border-l border-border bg-background p-6 pt-8 shadow-xl',
                'animate-in slide-in-from-right duration-300'
              )}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
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
                  href="/my-portraits"
                  className={cn(getButtonClassName('outline', 'lg'), 'rounded-full justify-start')}
                  onClick={closeDrawer}
                >
                  My Portraits
                </Link>
                <Link
                  href="/cart"
                  className={cn(getButtonClassName('outline', 'lg'), 'rounded-full justify-start')}
                  onClick={closeDrawer}
                >
                  Cart
                </Link>
                <Link
                  href="/order-lookup"
                  className={cn(getButtonClassName('outline', 'lg'), 'rounded-full justify-start')}
                  onClick={closeDrawer}
                >
                  Order lookup
                </Link>
                <Link
                  href="/pricing"
                  className={cn(getButtonClassName('outline', 'lg'), 'rounded-full justify-start')}
                  onClick={closeDrawer}
                >
                  Pricing
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/account"
                      className={cn(getButtonClassName('default', 'lg'), 'rounded-full justify-start')}
                      onClick={closeDrawer}
                    >
                      My account
                    </Link>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="rounded-full justify-start w-full"
                      onClick={handleSignOut}
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className={cn(getButtonClassName('ghost', 'lg'), 'rounded-full justify-start')}
                    onClick={closeDrawer}
                  >
                    Log in
                  </Link>
                )}
              </div>
            </div>
          </>,
          document.body
        )
      : null

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-4xl mx-auto items-center justify-between px-4">
          <Link
            href="/"
            className="font-heading text-lg font-semibold text-foreground hover:text-primary transition-colors duration-200"
          >
            petportrait.shop
          </Link>

          {/* Menu: all nav options are inside the drawer. Icon can be replaced later. */}
          <Button
            ref={menuButtonRef}
            variant="ghost"
            className="min-h-[44px] min-w-[44px] rounded-full"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>
      {drawerContent}
    </>
  )
}
