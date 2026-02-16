'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { OutOfCreditsModal } from '@/components/out-of-credits-modal'

/**
 * Upload option on the main page. Do not remove – must stay on the home page.
 * Primary CTA for users to start creating a portrait.
 * Shows live token balance. When 0 tokens, click opens sign-up / buy-credits modal.
 */
export function UploadSection() {
  const [tokens, setTokens] = useState<number | null>(null)
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false)

  useEffect(() => {
    fetch('/api/credits', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setTokens(d.balance ?? null))
      .catch(() => setTokens(null))
  }, [])

  const uploadAreaClass =
    'flex flex-col items-center justify-center min-h-[140px] w-full rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/15 hover:border-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-8 animate-fade-in animate-fade-in-delay-2'

  return (
    <section className="w-full max-w-3xl mx-auto mb-10" aria-label="Start creating">
      {tokens === 0 ? (
        <button
          type="button"
          onClick={() => setShowOutOfCreditsModal(true)}
          className={uploadAreaClass + ' cursor-pointer text-left'}
        >
          <span className="text-4xl mb-3" aria-hidden>
            📷
          </span>
          <span className="font-semibold text-foreground text-lg">
            Upload your photo
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            <strong className="text-foreground">0 free portraits</strong> · No sign-in required
          </span>
        </button>
      ) : (
        <Link href="/pet-portraits" className={uploadAreaClass}>
          <span className="text-4xl mb-3" aria-hidden>
            📷
          </span>
          <span className="font-semibold text-foreground text-lg">
            Upload your photo
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            {tokens !== null ? (
              <>
                <strong className="text-foreground">{tokens} free portrait{tokens !== 1 ? 's' : ''}</strong> · No sign-in required
              </>
            ) : (
              'Start with a pet portrait – 2 free portraits, no sign-in required'
            )}
          </span>
        </Link>
      )}
      <OutOfCreditsModal open={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
    </section>
  )
}
