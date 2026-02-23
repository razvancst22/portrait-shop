'use client'

import dynamic from 'next/dynamic'

const Turnstile = dynamic(
  () =>
    import('@marsidev/react-turnstile').then((mod) => mod.Turnstile),
  { ssr: false }
)

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export type TurnstileCaptchaProps = {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: (errorCode?: string) => void
  className?: string
}

/**
 * Renders Cloudflare Turnstile widget only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * When disabled, the parent form proceeds without captcha verification.
 */
export function TurnstileCaptcha({ onVerify, onExpire, onError, className }: TurnstileCaptchaProps) {
  if (!TURNSTILE_SITE_KEY) return null

  return (
    <div className={className}>
      <Turnstile
        siteKey={TURNSTILE_SITE_KEY}
        onSuccess={onVerify}
        onExpire={onExpire}
        onError={onError}
        options={{ size: 'normal', theme: 'dark' }}
      />
    </div>
  )
}

export function isTurnstileEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
}
