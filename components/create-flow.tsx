'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/primitives/button'
import { Card, CardContent } from '@/components/primitives/card'
import { Label } from '@/components/primitives/label'
import { Skeleton } from '@/components/primitives/skeleton'
import { Input } from '@/components/primitives/input'
import { cn } from '@/lib/utils'
import type { SubjectTypeId } from '@/lib/prompts/artStyles'
import { CREATE_FLOW_COPY } from '@/lib/create-flow-config'
import { OutOfCreditsModal } from '@/components/out-of-credits-modal'

type StyleItem = {
  id: string
  name: string
  description: string
  exampleImageUrl: string
}

type Step = 'upload' | 'preview' | 'styles' | 'generating'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_MB = 10

type CreateFlowProps = {
  category: SubjectTypeId
}

export function CreateFlow({ category }: CreateFlowProps) {
  const router = useRouter()
  const copy = CREATE_FLOW_COPY[category]
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [styles, setStyles] = useState<StyleItem[]>([])
  const [loadingStyles, setLoadingStyles] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [genStatus, setGenStatus] = useState<string>('generating')
  const [nameValue, setNameValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [insufficientCredits, setInsufficientCredits] = useState(false)
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const validateAndSetFile = useCallback((f: File | null) => {
    if (!f) return
    if (tokenBalance === 0) {
      setShowOutOfCreditsModal(true)
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setError('Please use JPEG, PNG or WebP.')
      return
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB.`)
      return
    }
    setError(null)
    setFile(f)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(f)
    })
    setStep('preview')
  }, [tokenBalance])

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(e.target.files?.[0] ?? null)
  }, [validateAndSetFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    validateAndSetFile(e.dataTransfer.files?.[0] ?? null)
  }, [validateAndSetFile])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false)
  }, [])

  const changePhoto = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setStep('upload')
    setError(null)
  }, [previewUrl])

  const loadStyles = useCallback(async () => {
    setLoadingStyles(true)
    setError(null)
    try {
      const [stylesRes, creditsRes] = await Promise.all([
        fetch(`/api/styles?category=${category}`),
        fetch('/api/credits', { credentials: 'include' }),
      ])
      if (!stylesRes.ok) throw new Error('Failed to load styles')
      const data = await stylesRes.json()
      setStyles(data)
      if (data.length) setSelectedStyle(data[0].id)
      if (creditsRes.ok) {
        const credits = await creditsRes.json()
        setTokenBalance(credits.balance ?? null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load styles')
    } finally {
      setLoadingStyles(false)
    }
  }, [category])

  const goToChooseStyle = useCallback(() => {
    setError(null)
    setInsufficientCredits(false)
    setStep('styles')
    loadStyles()
  }, [loadStyles])

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/credits', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTokenBalance(data.balance ?? null)
      }
    } catch {
      setTokenBalance(null)
    }
  }, [])

  useEffect(() => {
    if (step === 'upload') fetchCredits()
  }, [step, fetchCredits])

  const startGeneration = useCallback(async () => {
    if (!file || !selectedStyle) return
    setError(null)
    setInsufficientCredits(false)
    setStep('generating')
    setProgress(0)
    setGenStatus('generating')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        const message = uploadRes.status === 503
          ? (err.error || 'Upload is not configured yet. Set up Supabase to enable uploads.')
          : (err.error || `Upload failed: ${uploadRes.status}`)
        throw new Error(message)
      }
      const { imageUrl } = await uploadRes.json()
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          artStyle: selectedStyle,
          subjectType: category,
        }),
        credentials: 'include',
      })
      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({}))
        if (genRes.status === 403 && err.code === 'INSUFFICIENT_CREDITS') {
          setInsufficientCredits(true)
          setError(err.error ?? "You've used your 2 free portraits. Sign in to get more, or buy credits.")
        } else if (genRes.status === 503 && err.code === 'SUPABASE_NOT_CONFIGURED') {
          setError(err.error ?? 'Generation is not configured yet. Set up Supabase to enable generation.')
        } else {
          setError(err.error || `Generation failed: ${genRes.status}`)
        }
        setStep('styles')
        if (genRes.status === 403) fetchCredits()
        return
      }
      const { generationId: id } = await genRes.json()
      setGenerationId(id)
      fetchCredits()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStep('styles')
    }
  }, [file, selectedStyle, category, fetchCredits])

  useEffect(() => {
    if (step !== 'generating' || !generationId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/generate/${generationId}/status`)
        if (!res.ok) return
        const data = await res.json()
        setGenStatus(data.status ?? 'generating')
        if (typeof data.progress === 'number') setProgress(data.progress)
        if (data.status === 'completed') {
          if (pollRef.current) clearInterval(pollRef.current)
          if (nameValue.trim()) {
            await fetch(`/api/generate/${generationId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ petName: nameValue.trim() }),
            }).catch(() => {})
          }
          router.push(`/preview/${generationId}`)
          return
        }
        if (data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current)
          setError(data.errorMessage ?? 'Generation failed.')
        }
      } catch {
        // keep polling
      }
    }
    poll()
    pollRef.current = setInterval(poll, 2000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [step, generationId, router, nameValue])

  if (step === 'upload') {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <main className="max-w-xl text-center w-full">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3 animate-fade-in-up">
            {copy.headline}
          </h1>
          <p className="text-muted-foreground mb-2 text-lg animate-fade-in animate-fade-in-delay-1">
            {copy.subhead}
          </p>
          <p className="text-sm text-muted-foreground mb-8 animate-fade-in">
            {tokenBalance !== null ? (
              <><strong className="text-foreground">{tokenBalance} free portrait{tokenBalance !== 1 ? 's' : ''}</strong> remaining · No sign-in required</>
            ) : (
              <>Free portraits · No sign-in required</>
            )}
          </p>
          <input
            type="file"
            accept={ACCEPT}
            onChange={onFileChange}
            className="hidden"
            id="upload-photo"
          />
          <label
            htmlFor={tokenBalance === 0 ? undefined : 'upload-photo'}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (tokenBalance === 0 && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                setShowOutOfCreditsModal(true)
              }
            }}
            onClick={(e) => {
              if (tokenBalance === 0) {
                e.preventDefault()
                setShowOutOfCreditsModal(true)
              }
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              'flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors w-full animate-fade-in animate-fade-in-delay-2',
              isDragOver ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <span className="text-5xl mb-4 opacity-60">📷</span>
            <span className="font-medium text-foreground">
              {isDragOver ? copy.uploadDropLabel : copy.uploadLabel}
            </span>
            <span className="mt-2 text-sm text-muted-foreground">
              Click or drag here · JPEG, PNG or WebP, max {MAX_MB}MB
            </span>
          </label>
          {error && (
            <p className="mt-4 text-sm text-destructive animate-fade-in" role="alert">{error}</p>
          )}
          <OutOfCreditsModal open={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
        </main>
      </div>
    )
  }

  if (step === 'preview' && previewUrl) {
    return (
      <div className="py-8 px-4">
        <div className="container max-w-lg mx-auto text-center animate-fade-in">
          <Button variant="ghost" size="sm" className="mb-6 rounded-full -ml-2" onClick={changePhoto}>
            ← Back
          </Button>
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">{copy.previewTitle}</h1>
          <p className="text-muted-foreground mb-6">{copy.previewSubhead}</p>
          <div className="relative aspect-[4/5] max-w-sm mx-auto rounded-xl overflow-hidden bg-muted mb-6">
            <Image src={previewUrl} alt={copy.previewAlt} fill className="object-cover" unoptimized />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={goToChooseStyle} className="rounded-full" size="lg">
              Choose style
            </Button>
            <Button onClick={changePhoto} variant="outline" className="rounded-full" size="lg">
              Change photo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'styles') {
    return (
      <div className="py-8 px-4">
        <div className="container max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-6 rounded-full -ml-2" onClick={() => setStep('preview')}>
            ← Back
          </Button>
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">Choose a style</h1>
          <p className="text-muted-foreground mb-2">Select one – we'll generate your portrait in that style.</p>
          {tokenBalance !== null && (
            <p className="text-sm text-muted-foreground mb-6">
              {tokenBalance} free portrait{tokenBalance !== 1 ? 's' : ''} remaining.
              {tokenBalance === 0 && (
                <> <Link href="/pricing" className="text-primary underline">Buy credits</Link> or sign in for more.</>
              )}
            </p>
          )}

          {loadingStyles && styles.length === 0 ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="text-center">
                <Skeleton className="mx-auto h-8 w-48 mb-4" />
                <p className="text-muted-foreground">Loading styles…</p>
              </div>
            </div>
          ) : error && styles.length === 0 ? (
            <div className="max-w-md mx-auto text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={loadStyles} className="rounded-full">Retry</Button>
            </div>
          ) : styles.length === 0 ? (
            <p className="text-muted-foreground text-center">No styles available. Try again later.</p>
          ) : (
            <>
              <div className="mb-6">
                <Label htmlFor="name-style">{copy.nameLabel}</Label>
                <Input
                  id="name-style"
                  type="text"
                  placeholder={copy.namePlaceholder}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="mt-1.5 max-w-xs rounded-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">{copy.nameHint}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {styles.map((style, i) => (
                  <Card
                    key={style.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedStyle(style.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedStyle(style.id)}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/50 p-0 overflow-hidden gap-0 animate-fade-in-up',
                      selectedStyle === style.id && 'ring-2 ring-primary border-primary'
                    )}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                          Example
                        </div>
                        <Image
                          src={style.exampleImageUrl}
                          alt={style.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 50vw"
                          unoptimized
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      </div>
                      <div className="p-4">
                        <div className="font-medium text-foreground">{style.name}</div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{style.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {error && (
                <div className="mb-4" role="alert">
                  <p className="text-sm text-destructive">{error}</p>
                  {insufficientCredits && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <Link href="/pricing" className="text-primary font-medium underline">Buy credits</Link>
                      {' · '}
                      <Link href="/login" className="text-primary font-medium underline">Sign in</Link>
                    </p>
                  )}
                </div>
              )}
              <Button onClick={startGeneration} disabled={!selectedStyle} className="w-full rounded-full" size="lg">
                {copy.ctaButton}
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (step === 'generating') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8 bg-generating">
        <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
          <h1 className="font-heading text-xl font-semibold text-foreground">{copy.generatingTitle}</h1>
          <div className="w-full space-y-2">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-muted-foreground">{progress}%</p>
          </div>
          <div className="text-left space-y-2">
            <Label htmlFor="name-generating">{copy.nameLabel}</Label>
            <Input
              id="name-generating"
              type="text"
              placeholder={copy.namePlaceholder}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="rounded-full"
            />
            <p className="text-xs text-muted-foreground">Optional.</p>
          </div>
          {genStatus === 'failed' && error && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>
          )}
          {genStatus === 'failed' && (
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { setError(null); setStep('styles'); }} variant="outline" className="rounded-full">
                Try again
              </Button>
              <Button
                onClick={() => {
                  setError(null)
                  setStep('upload')
                  setFile(null)
                  if (previewUrl) URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                }}
                variant="ghost"
                className="rounded-full"
              >
                Start over
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
