'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, Download, Package, Plus, ArrowLeft, ChevronRight, LogOut, ShoppingBag, HelpCircle } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { useCreditsUpdateListener } from '@/lib/credits-events'
import { MyPortraitsContent } from '@/components/my-portraits-content'
import { AddCreditsModal } from '@/components/add-credits-modal'
import { ToastContainer } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type BalanceBreakdown = {
  freeGenerationsRemaining: number
  packGenerationsRemaining: number
  packDownloadsRemaining: number
  totalCredits: number
  packTypes: string[]
}

export function AccountDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [balance, setBalance] = useState<BalanceBreakdown | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [addCreditsModalOpen, setAddCreditsModalOpen] = useState(false)

  const loadBalance = useCallback(() => {
    setLoadingBalance(true)
    fetch('/api/account/balance', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) =>
        setBalance({
          freeGenerationsRemaining: d.freeGenerationsRemaining ?? 0,
          packGenerationsRemaining: d.packGenerationsRemaining ?? 0,
          packDownloadsRemaining: d.packDownloadsRemaining ?? 0,
          totalCredits: d.totalCredits ?? 0,
          packTypes: d.packTypes ?? [],
        })
      )
      .catch(() => setBalance(null))
      .finally(() => setLoadingBalance(false))
  }, [])

  useEffect(() => {
    loadBalance()
  }, [loadBalance])

  useEffect(() => {
    loadBalance()
  }, [loadBalance, user])

  useCreditsUpdateListener(loadBalance)

  const handleSignOut = async () => {
    const supabase = createClient()
    await fetch('/api/auth/clear-guest-cookies', { method: 'POST', credentials: 'include' })
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const totalCredits = balance?.totalCredits ?? 0
  const packDownloads = balance?.packDownloadsRemaining ?? 0

  return (
    <div className="w-full max-w-3xl mx-auto text-left space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="size-4" />
        Back to home
      </Link>

      {/* Profile strip - email only, no avatar */}
      {user?.email && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2">
            My Account
          </h1>
          <p className="text-muted-foreground">
            Manage your plan, portrait credits, and order history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddCreditsModalOpen(true)}
          className="glass-green inline-flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <Plus className="size-4" />
          Add Credits
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          <ShoppingBag className="size-4" />
          Order History
          <ChevronRight className="size-4" />
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
        >
          <HelpCircle className="size-4" />
          Get Help
        </Link>
      </div>

      {/* Credits cards - glassmorphism */}
      <div className="grid grid-cols-2 gap-4">
        {/* Portrait Generations */}
        <div
          className={cn(
            'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
            'border border-border/50',
            totalCredits > 0 && 'ring-1 ring-primary/20'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Sparkles className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Portrait Generations
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {loadingBalance ? '…' : totalCredits}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Portrait Downloads */}
        <div
          className={cn(
            'glass-liquid glass-liquid-soft glass-liquid-hover p-6 rounded-2xl',
            'border border-border/50'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Download className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Portrait Downloads
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground">
                  {loadingBalance ? '…' : packDownloads}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low credits callout */}
      {!loadingBalance && balance && totalCredits > 0 && totalCredits <= 2 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Running low — add credits to keep creating.
          <button
            type="button"
            onClick={() => setAddCreditsModalOpen(true)}
            className="ml-2 font-medium underline hover:no-underline"
          >
            Add credits
          </button>
        </div>
      )}

      {/* My Portraits – only Generated Artworks and Purchased Artworks categories */}
      <MyPortraitsContent variant="embedded" />

      {/* Order History link card */}
      <Link
        href="/account/orders"
        className={cn(
          'glass-liquid glass-liquid-soft glass-liquid-hover flex items-center justify-between gap-4 p-6 rounded-2xl',
          'border border-border/50 transition-transform hover:-translate-y-0.5'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Package className="size-6" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Order History
            </h2>
            <p className="text-sm text-muted-foreground">
              View your orders and download your portraits.
            </p>
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>

      <AddCreditsModal
        open={addCreditsModalOpen}
        onClose={() => setAddCreditsModalOpen(false)}
        isLoggedIn={true}
        onCreditsAdded={loadBalance}
      />
      <ToastContainer />
    </div>
  )
}
