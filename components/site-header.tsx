'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/primitives/button'
import { getButtonClassName } from '@/components/primitives/button'
import { Menu, ChevronDown, ChevronRight, Heart, Users, Baby, PawPrint, User as UserIcon, Clock, DollarSign, Settings, LogOut, Palette, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddCreditsModal } from '@/components/add-credits-modal'
import { CATEGORY_ROUTES, SUBJECT_TYPE_IDS } from '@/lib/prompts/artStyles'
import { SITE_NAME } from '@/lib/site-config'
import { Logo } from '@/components/logo'
import { createClient } from '@/lib/supabase/client'
import { useCreditsUpdateListener } from '@/lib/credits-events'
import type { User } from '@supabase/supabase-js'

const FOCUSABLE = 'a[href], button:not([disabled])'

const CREATE_ICONS = {
  pet: PawPrint,
  dog: PawPrint,
  cat: PawPrint,
  family: Users,
  children: Baby,
  couple: Heart,
  self: UserIcon,
} as const

export function SiteHeader() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [createExpanded, setCreateExpanded] = useState(true)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const fetchCredits = useCallback(() => {
    fetch('/api/credits', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setCredits(d.balance ?? null))
      .catch(() => setCredits(null))
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      fetchCredits()
    })
    return () => subscription.unsubscribe()
  }, [fetchCredits])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  useCreditsUpdateListener(fetchCredits)

  const handleSignOut = async () => {
    closeDrawer()
    const supabase = createClient()
    await fetch('/api/auth/clear-guest-cookies', { method: 'POST', credentials: 'include' })
    await supabase.auth.signOut()
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
  const openAddCredits = () => {
    setShowAddCreditsModal(true)
    closeDrawer()
  }

  const drawerContent =
    mounted && drawerOpen
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
                'fixed inset-y-0 left-0 z-[101] w-[280px] max-w-[85vw] flex flex-col gap-4 border-r border-border bg-background p-6 pt-8 shadow-xl',
                'animate-in slide-in-from-left duration-300'
              )}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="">
                <Link
                  href="/"
                  className="font-heading text-lg font-semibold text-foreground truncate max-w-[180px] block"
                  onClick={(e) => {
                    e.preventDefault()
                    closeDrawer()
                    router.push('/')
                  }}
                  title={user?.email ?? SITE_NAME}
                >
                  {user?.email ?? SITE_NAME}
                </Link>
                {user ? (
                  <button
                    className={cn(
                      'flex items-center justify-center gap-2 mt-2 p-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground font-medium w-full border border-border'
                    )}
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-4" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className={cn(
                      'flex items-center justify-center gap-2 mt-2 p-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground font-medium w-full border border-border'
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      closeDrawer()
                      router.push('/login')
                    }}
                  >
                    <UserIcon className="size-4" />
                    <span>Sign In</span>
                  </Link>
                )}
                {credits !== null && credits > 0 && (
                  <button
                    type="button"
                    className={cn(
                      'glass-green mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm',
                      'shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200'
                    )}
                    onClick={openAddCredits}
                  >
                    <Sparkles className="size-5" />
                    <span>Add Credits</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {/* Account (when logged in) */}
                {user && (
                  <Link
                    href="/account"
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground'
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      closeDrawer()
                      router.push('/account')
                    }}
                  >
                    <Settings className="size-5" />
                    <span>Account</span>
                  </Link>
                )}

                {/* Portraits */}
                <Link
                  href="/my-portraits"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground'
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    closeDrawer()
                    router.push('/my-portraits')
                  }}
                >
                  <Clock className="size-5" />
                  <span>Portraits</span>
                </Link>

                {/* Create Section (Expandable) */}
                <div>
                  <button
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors',
                      'text-left font-medium text-foreground'
                    )}
                    onClick={() => setCreateExpanded(!createExpanded)}
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="size-5" />
                      <span>Create</span>
                    </div>
                    {createExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </button>
                  
                  {createExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {SUBJECT_TYPE_IDS.map((id) => {
                        const route = CATEGORY_ROUTES[id]
                        const Icon = CREATE_ICONS[id]
                        return (
                          <Link
                            key={id}
                            href={route.path}
                            className="flex items-center gap-3 p-2 rounded-md text-foreground font-medium hover:bg-muted/50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault()
                              closeDrawer()
                              router.push(route.path)
                            }}
                          >
                            <Icon className="size-4" />
                            <span>{route.title}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Pricing */}
                <Link
                  href="/pricing"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-foreground'
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    closeDrawer()
                    router.push('/pricing')
                  }}
                >
                  <DollarSign className="size-5" />
                  <span>Pricing</span>
                </Link>

              </div>

            </div>
          </>,
          document.body
        )
      : null

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-4xl mx-auto items-center px-4 flex-nowrap">
          <div className="flex flex-1 items-center justify-start">
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
          <div className="flex flex-1 items-center justify-center">
            <Logo href="/" className="transition-opacity hover:opacity-80" height={36} />
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            {credits === 0 && (
              <button
                type="button"
                className={cn(
                  'glass-green flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm whitespace-nowrap shrink-0',
                  'shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200'
                )}
                onClick={() => setShowAddCreditsModal(true)}
              >
                Add Credits
              </button>
            )}
          </div>
        </div>
      </header>
      {drawerContent}
      <AddCreditsModal
        open={showAddCreditsModal}
        onClose={() => setShowAddCreditsModal(false)}
        isLoggedIn={!!user}
        onCreditsAdded={fetchCredits}
      />
    </>
  )
}
