'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/primitives/button'
import { Input } from '@/components/primitives/input'
import { Label } from '@/components/primitives/label'
import {
  PasswordStrengthIndicator,
  getPasswordStrength,
  meetsMinStrength,
} from '@/components/auth/password-strength'
import {
  TurnstileCaptcha,
  isTurnstileEnabled,
} from '@/components/auth/turnstile-captcha'

type Mode = 'signin' | 'signup'

type AuthFormProps = {
  /** Redirect URL after successful sign-in */
  redirectUrl?: string
  /** Start in signup mode (e.g. from create-account page) */
  initialMode?: Mode
}

const inputBase = 'mt-1.5 rounded-full glass-input'
const inputWithToggle = inputBase + ' pr-10'

export function AuthForm({ redirectUrl, initialMode = 'signin' }: AuthFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const turnstileEnabled = isTurnstileEnabled()
  const strength = getPasswordStrength(password)
  const passwordStrongEnough = meetsMinStrength(strength, 'medium')
  const passwordsMatch = !confirmPassword || password === confirmPassword
  const confirmTouched = confirmPassword.length > 0
  const captchaReady = !turnstileEnabled || !!captchaToken
  const canSubmit =
    captchaReady &&
    (mode === 'signin' ||
      (passwordStrongEnough && passwordsMatch && password.length >= 8))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (mode === 'signup') {
      if (!passwordStrongEnough) {
        setMessage({
          type: 'error',
          text: 'Password must be at least 8 characters with a mix of letters, numbers, or symbols.',
        })
        return
      }
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'Passwords do not match.' })
        return
      }
    }

    if (turnstileEnabled && captchaToken) {
      const verifyRes = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      const { valid } = (await verifyRes.json()) as { valid?: boolean }
      if (!valid) {
        setMessage({ type: 'error', text: 'Verification failed. Please try again.' })
        setCaptchaToken(null)
        setCaptchaResetKey((k) => k + 1)
        setLoading(false)
        return
      }
    }

    setLoading(true)
    const supabase = createClient()

    try {
      if (mode === 'signup') {
        const redirectParam = redirectUrl ? `?next=${encodeURIComponent(redirectUrl)}` : ''
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback${redirectParam}`,
          },
        })
        if (error) {
          setMessage({ type: 'error', text: error.message })
          setCaptchaResetKey((k) => k + 1)
          setLoading(false)
          return
        }
        setMessage({
          type: 'success',
          text: 'Check your email for the confirmation link.',
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setMessage({ type: 'error', text: error.message })
          setCaptchaResetKey((k) => k + 1)
          setLoading(false)
          return
        }
        await fetch('/api/auth/link-guest', { method: 'POST', credentials: 'include' })
        router.push(redirectUrl && redirectUrl.startsWith('/') ? redirectUrl : '/account')
        router.refresh()
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Something went wrong',
      })
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode: Mode) => {
    setMode(newMode)
    setMessage(null)
    setConfirmPassword('')
    setCaptchaToken(null)
  }

  return (
    <div className="glass-liquid glass-liquid-soft glass-liquid-hover p-6 md:p-8 rounded-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 text-left max-w-sm mx-auto">
        <div>
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputBase}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="auth-password">Password</Label>
          <div className="relative">
            <Input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputWithToggle}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {mode === 'signup' && (
            <PasswordStrengthIndicator password={password} minStrength="medium" />
          )}
          {mode === 'signup' && (
            <p className="text-xs text-muted-foreground mt-1">
              8+ characters, mix of letters and numbers or symbols
            </p>
          )}
        </div>
        {mode === 'signup' && (
          <div>
            <Label htmlFor="auth-confirm-password">Confirm password</Label>
            <div className="relative">
              <Input
                id="auth-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={inputWithToggle}
                placeholder="••••••••"
                aria-invalid={confirmTouched && !passwordsMatch}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
            {confirmTouched && !passwordsMatch && (
              <p className="text-xs text-destructive mt-1.5" role="alert">
                Passwords do not match
              </p>
            )}
          </div>
        )}
        <TurnstileCaptcha
          key={captchaResetKey}
          onVerify={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
          className="flex justify-center min-h-[65px]"
        />
        {message && (
          <p
            className={`text-sm rounded-lg px-3 py-2 ${
              message.type === 'error'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
            role="alert"
          >
            {message.text}
          </p>
        )}
        <Button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full rounded-full glass-button"
          size="lg"
        >
          {loading ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Sign up'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-primary font-medium underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="text-primary font-medium underline"
              >
                Log in
              </button>
            </>
          )}
        </p>
        <p className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to home
          </Link>
        </p>
      </form>
    </div>
  )
}
