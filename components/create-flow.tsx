'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCreditsUpdateListener } from '@/lib/credits-events'
import { Button, getButtonClassName } from '@/components/primitives/button'
import { cn } from '@/lib/utils'
import type { SubjectTypeId } from '@/lib/prompts/artStyles'
import { ART_STYLE_IDS } from '@/lib/prompts/artStyles'
import { CREATE_FLOW_COPY } from '@/lib/create-flow-config'
import { AddCreditsModal } from '@/components/add-credits-modal'
import { UploadPhotoArea } from '@/components/upload-photo-area'
import { StyleCardGrid } from '@/components/style-card-grid'
import { CategoryDropdown } from '@/components/category-dropdown'
import { compressImageForUpload } from '@/lib/image/compress-upload'

type Step = 'upload' | 'post-upload' | 'generating'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_MB = 10
const MIN_PHOTOS_COUPLE = 2
const MIN_PHOTOS_FAMILY = 2
const MAX_PHOTOS_FAMILY = 6

const GENERATING_MESSAGES = [
  'Analyzing your photo…',
  'Studying the composition…',
  'Mixing colors on the palette…',
  'Adding artistic flair…',
  'Bringing your portrait to life…',
  'Adding the finishing touches…',
  'Almost there…',
  'Just a moment longer…',
]

type CreateFlowProps = {
  category: SubjectTypeId
}

export function CreateFlow({ category }: CreateFlowProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const copy = CREATE_FLOW_COPY[category]
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  /** When user uploaded from the home page, we get imageUrl in the URL and skip re-upload in startGeneration */
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  /** Multi-photo for family/couple */
  const [multiFiles, setMultiFiles] = useState<File[]>([])
  const [multiPreviewUrls, setMultiPreviewUrls] = useState<string[]>([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [displayProgress, setDisplayProgress] = useState(0)
  const [statusMessageIndex, setStatusMessageIndex] = useState(0)
  const [genStatus, setGenStatus] = useState<string>('generating')
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [insufficientCredits, setInsufficientCredits] = useState(false)
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isMultiPhoto = category === 'family' || category === 'couple'
  const minPhotos = category === 'couple' ? MIN_PHOTOS_COUPLE : MIN_PHOTOS_FAMILY
  const maxPhotos = category === 'couple' ? MIN_PHOTOS_COUPLE : MAX_PHOTOS_FAMILY

  // If we landed here with ?imageUrl=... (e.g. from home page), go straight to post-upload
  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl')
    if (imageUrl && !isMultiPhoto) {
      setPreviewUrl(imageUrl)
      setUploadedImageUrl(imageUrl)
      setStep('post-upload')
      setSelectedStyle(ART_STYLE_IDS[0])
    }
  }, [searchParams, isMultiPhoto])

  const validateAndSetFile = useCallback(
    (f: File | null) => {
      if (!f) return
      if (tokenBalance === 0) {
        setShowAddCreditsModal(true)
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
      if (isMultiPhoto) {
        setMultiFiles((prev) => {
          if (prev.length >= maxPhotos) return prev
          const next = [...prev, f]
          if (next.length >= minPhotos) {
            setStep('post-upload')
            setSelectedStyle((s) => s ?? ART_STYLE_IDS[0])
          }
          return next
        })
        setMultiPreviewUrls((prev) =>
          prev.length >= maxPhotos ? prev : [...prev, URL.createObjectURL(f)]
        )
      } else {
        setFile(f)
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(f)
        })
        setStep('post-upload')
        setSelectedStyle(ART_STYLE_IDS[0])
      }
    },
    [tokenBalance, isMultiPhoto, maxPhotos, minPhotos]
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files?.length) return
      const remainingSlots = isMultiPhoto ? maxPhotos - multiFiles.length : 1
      const toAdd = Math.min(files.length, remainingSlots)
      for (let i = 0; i < toAdd; i++) {
        validateAndSetFile(files[i])
      }
      e.target.value = ''
    },
    [validateAndSetFile, isMultiPhoto, maxPhotos, multiFiles.length]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (!files?.length) return
      if (isMultiPhoto) {
        const remainingSlots = maxPhotos - multiFiles.length
        const toAdd = Math.min(files.length, remainingSlots)
        for (let i = 0; i < toAdd; i++) {
          validateAndSetFile(files[i])
        }
      } else {
        validateAndSetFile(files[0])
      }
    },
    [validateAndSetFile, isMultiPhoto, maxPhotos, multiFiles.length]
  )

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
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    multiPreviewUrls.forEach((u) => u.startsWith('blob:') && URL.revokeObjectURL(u))
    setFile(null)
    setPreviewUrl(null)
    setUploadedImageUrl(null)
    setMultiFiles([])
    setMultiPreviewUrls([])
    setUploadedImageUrls([])
    setStep('upload')
    setError(null)
    router.replace(pathname ?? '/')
  }, [previewUrl, multiPreviewUrls, router, pathname])

  const removeMultiPhoto = useCallback((index: number) => {
    setMultiPreviewUrls((prev) => {
      const u = prev[index]
      if (u?.startsWith('blob:')) URL.revokeObjectURL(u)
      return prev.filter((_, i) => i !== index)
    })
    setMultiFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])


  useEffect(() => {
    if (step === 'post-upload' && !selectedStyle) {
      setSelectedStyle(ART_STYLE_IDS[0])
    }
  }, [step, selectedStyle])

  const fetchCredits = useCallback(async () => {
    try {
      const res = await fetch('/api/credits', { credentials: 'include', cache: 'no-store' })
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

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      fetchCredits()
    })
    return () => subscription.unsubscribe()
  }, [fetchCredits])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchCredits()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchCredits])

  useCreditsUpdateListener(fetchCredits)

  const startGeneration = useCallback(async () => {
    if (!selectedStyle) return
    let resolvedImageUrl: string | null = uploadedImageUrl
    let resolvedImageUrls: string[] = uploadedImageUrls.length > 0 ? uploadedImageUrls : []

    if (isMultiPhoto && multiFiles.length >= minPhotos) {
      if (resolvedImageUrls.length === 0) {
        setError(null)
        setInsufficientCredits(false)
        setStep('generating')
        setProgress(0)
        setDisplayProgress(0)
        setStatusMessageIndex(0)
        setGenStatus('generating')
        try {
          const formData = new FormData()
          for (let i = 0; i < multiFiles.length; i++) {
            const { file: fileToUpload } = await compressImageForUpload(multiFiles[i])
            formData.append('file', fileToUpload)
          }
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({}))
            throw new Error(err.error || `Upload failed: ${uploadRes.status}`)
          }
          const data = await uploadRes.json()
          resolvedImageUrls = data.imageUrls ?? (data.imageUrl ? [data.imageUrl] : [])
          setUploadedImageUrls(resolvedImageUrls)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Something went wrong')
          setStep('post-upload')
          return
        }
      }
    } else if (!resolvedImageUrl) {
      if (!file) return
      setError(null)
      setInsufficientCredits(false)
      setStep('generating')
      setProgress(0)
      setDisplayProgress(0)
      setStatusMessageIndex(0)
      setGenStatus('generating')
      try {
        const { file: fileToUpload } = await compressImageForUpload(file)
        const formData = new FormData()
        formData.append('file', fileToUpload)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          let message: string
          if (uploadRes.status === 413) {
            message = 'Photo is too large. Please choose a smaller image or take a new photo.'
          } else if (uploadRes.status === 503) {
            message = err.error || 'Upload is not configured yet. Set up Supabase to enable uploads.'
          } else {
            message = err.error || `Upload failed: ${uploadRes.status}`
          }
          throw new Error(message)
        }
        const { imageUrl } = await uploadRes.json()
        resolvedImageUrl = imageUrl
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
        setStep('post-upload')
        return
      }
    }

    setError(null)
    setInsufficientCredits(false)
    setStep('generating')
    setProgress(0)
    setDisplayProgress(0)
    setStatusMessageIndex(0)
    setGenStatus('generating')
    try {
      const body: Record<string, unknown> = {
        artStyle: selectedStyle,
        subjectType: category,
      }
      if (resolvedImageUrls.length >= 2) {
        body.imageUrls = resolvedImageUrls
      } else {
        body.imageUrl = resolvedImageUrl
      }
      if (category === 'dog') body.petType = 'dog'
      if (category === 'cat') body.petType = 'cat'

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      if (!genRes.ok) {
        const err = await genRes.json().catch(() => ({}))
        if (genRes.status === 403 && (err.code === 'INSUFFICIENT_CREDITS' || err.code === 'FREE_CAP_30_DAYS')) {
          setInsufficientCredits(true)
          setShowAddCreditsModal(true)
          setError(err.error ?? "You've used your 2 free portraits. Sign in to get more, or buy Portrait Generations.")
        } else if (genRes.status === 503 && err.code === 'SUPABASE_NOT_CONFIGURED') {
          setError(err.error ?? 'Generation is not configured yet. Set up Supabase to enable generation.')
        } else {
          setError(err.error || `Generation failed: ${genRes.status}`)
        }
        setStep('post-upload')
        if (genRes.status === 403) fetchCredits()
        return
      }
      const { generationId: id } = await genRes.json()
      setGenerationId(id)
      fetchCredits()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setStep('post-upload')
    }
  }, [
    file,
    selectedStyle,
    category,
    fetchCredits,
    uploadedImageUrl,
    uploadedImageUrls,
    isMultiPhoto,
    multiFiles,
    minPhotos,
  ])

  // Fake progress: smoothly advance from 0 toward 92% while waiting
  useEffect(() => {
    if (step !== 'generating' || genStatus === 'completed' || genStatus === 'failed') return
    const interval = setInterval(() => {
      setDisplayProgress((p) => {
        if (p >= 92) return p
        return Math.min(92, p + (92 - p) * 0.05)
      })
    }, 320)
    return () => clearInterval(interval)
  }, [step, genStatus])

  // Rotate status messages every 2.5s
  useEffect(() => {
    if (step !== 'generating' || genStatus === 'completed' || genStatus === 'failed') return
    const interval = setInterval(() => {
      setStatusMessageIndex((i) => (i + 1) % GENERATING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [step, genStatus])

  useEffect(() => {
    if (step !== 'generating' || !generationId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/generate/${generationId}/status`)
        if (!res.ok) return
        const data = await res.json()
        setGenStatus(data.status ?? 'generating')
        if (typeof data.progress === 'number') {
          setProgress(data.progress)
          setDisplayProgress(data.progress)
        }
        if (data.status === 'completed') {
          if (pollRef.current) clearInterval(pollRef.current)
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
  }, [step, generationId, router])

  if (step === 'upload') {
    const uploadSubtitleMessages = [
      'Use well-lit photos with clear faces',
      tokenBalance !== null
        ? `${tokenBalance} free portrait${tokenBalance !== 1 ? 's' : ''} remaining · No sign-in required`
        : 'Free portraits · No sign-in required',
      isMultiPhoto
        ? category === 'couple'
          ? `Add 2 photos · JPEG, PNG or WebP, max ${MAX_MB}MB each`
          : `Add ${minPhotos}-${maxPhotos} photos · JPEG, PNG or WebP, max ${MAX_MB}MB each`
        : `Click or drag here · JPEG, PNG or WebP, max ${MAX_MB}MB`,
    ]
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <main className="max-w-3xl text-center w-full">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 -mt-2 transition-colors"
          >
            ← Back to home
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3 animate-fade-in-up">
            {copy.headline}
          </h1>
          <input
            type="file"
            accept={ACCEPT}
            multiple={isMultiPhoto}
            onChange={onFileChange}
            className="hidden"
            id="upload-photo"
          />
          {isMultiPhoto && multiFiles.length > 0 ? (
            <div className="animate-fade-in animate-fade-in-delay-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {multiPreviewUrls.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                    <Image
                      src={url}
                      alt={`Person ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => removeMultiPhoto(i)}
                      className="absolute top-2 right-2 size-8 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
                      {i + 1}
                    </span>
                  </div>
                ))}
                {multiFiles.length < maxPhotos && (
                  <label
                    htmlFor="upload-photo"
                    className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-4xl text-muted-foreground">+</span>
                    <span className="text-sm text-muted-foreground mt-1">Add photo</span>
                  </label>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {multiFiles.length} of {maxPhotos} photo{maxPhotos > 1 ? 's' : ''}.
                {multiFiles.length < minPhotos &&
                  ` Add ${category === 'couple' ? '2' : `at least ${minPhotos}`} to continue.`}
              </p>
            </div>
          ) : (
            <UploadPhotoArea
              creditsCount={tokenBalance}
              creditsLabel="Portrait Generation"
              uploadTitle={isDragOver ? copy.uploadDropLabel : copy.uploadLabel}
              subtitle={uploadSubtitleMessages}
              subtitleRotateIntervalMs={4000}
              as="label"
              htmlFor="upload-photo"
              onKeyDown={(e) => {
                if (tokenBalance === 0 && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  setShowAddCreditsModal(true)
                }
              }}
              onClick={(e) => {
                if (tokenBalance === 0) {
                  e.preventDefault()
                  setShowAddCreditsModal(true)
                }
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              isDragOver={isDragOver}
              disabled={tokenBalance === 0}
              className="animate-fade-in animate-fade-in-delay-2"
              onAddCredits={tokenBalance === 0 ? () => setShowAddCreditsModal(true) : undefined}
              styleSelector={
                <CategoryDropdown currentCategory={category} disabled={tokenBalance === 0} />
              }
            />
          )}
          {error && (
            <p className="mt-4 text-sm text-destructive animate-fade-in" role="alert">{error}</p>
          )}
          <AddCreditsModal
            open={showAddCreditsModal}
            onClose={() => {
              setShowAddCreditsModal(false)
              fetchCredits()
            }}
            isLoggedIn={!!user}
            onCreditsAdded={fetchCredits}
          />
        </main>
      </div>
    )
  }

  if (step === 'post-upload' && (previewUrl || multiPreviewUrls.length >= minPhotos)) {
    return (
      <div className="flex flex-col items-center px-4 py-8 md:py-12">
        <main className="max-w-3xl w-full text-center">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-full -ml-2" onClick={changePhoto} type="button">
                ← Back
              </Button>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Back to home
              </Link>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={changePhoto} type="button">
              Change photo{isMultiPhoto ? 's' : ''}
            </Button>
          </div>
          <p className="text-sm font-medium text-foreground mb-3 text-center">
            Choose a style, then create your artwork.
          </p>
          {isMultiPhoto ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-sm mx-auto mb-6">
              {multiPreviewUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-muted/50 border border-white/20 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_16px_rgba(0,0,0,0.12)]">
                  <Image src={url} alt={`${copy.previewAlt} ${i + 1}`} fill className="object-cover object-center" unoptimized />
                  <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/50 text-white text-xs">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative aspect-[4/5] w-full max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-muted/50 border border-white/20 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_16px_rgba(0,0,0,0.12)] mb-6">
              <Image src={previewUrl!} alt={copy.previewAlt} fill className="object-cover object-center" unoptimized />
            </div>
          )}
          <StyleCardGrid
            selectedStyle={selectedStyle ?? undefined}
            onStyleSelect={setSelectedStyle}
            disabled={false}
            className="mb-4"
          />
          <Button
            onClick={startGeneration}
            disabled={!selectedStyle}
            className="w-full rounded-full"
            size="lg"
          >
            {copy.ctaButton}
          </Button>
          {error && (
            <p className="mt-3 text-sm text-destructive text-center" role="alert">
              {error}
            </p>
          )}
          {insufficientCredits && (
            <p className="mt-2 text-sm text-muted-foreground">
              <Link href="/pricing" className="text-primary font-medium underline">Buy Portrait Generations</Link>
              {' · '}
              <Link href="/login" className="text-primary font-medium underline">Sign in</Link>
            </p>
          )}
          <AddCreditsModal
            open={showAddCreditsModal}
            onClose={() => {
              setShowAddCreditsModal(false)
              fetchCredits()
            }}
            isLoggedIn={!!user}
            onCreditsAdded={fetchCredits}
          />
        </main>
      </div>
    )
  }

  if (step === 'generating') {
    const showProgress = genStatus === 'completed' ? progress : Math.round(displayProgress)
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8 bg-generating">
        <div className="w-full max-w-md text-center space-y-8 animate-fade-in animate-fade-in-delay-1">
          <div className="flex flex-col items-center gap-4">
            <Loader2
              className={cn('size-12 text-primary', genStatus === 'generating' && 'animate-spin')}
              aria-hidden
            />
            <h1 className="font-heading text-xl font-semibold text-foreground">{copy.generatingTitle}</h1>
            <p
              key={statusMessageIndex}
              className="text-sm text-muted-foreground min-h-[1.5rem] animate-fade-in"
            >
              {genStatus === 'generating'
                ? GENERATING_MESSAGES[statusMessageIndex]
                : genStatus === 'failed'
                  ? 'Something went wrong.'
                  : 'Done!'}
            </p>
          </div>
          <div className="w-full space-y-2">
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${showProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground tabular-nums">{showProgress}%</p>
          </div>
          {genStatus === 'failed' && error && (
            <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2 text-sm">{error}</div>
          )}
          {genStatus === 'failed' && (
            <div className="flex flex-wrap gap-3 justify-center">
              <Button onClick={() => { setError(null); setStep('post-upload'); }} variant="outline" className="rounded-full">
                Try again
              </Button>
              <Button
                onClick={() => {
                  setError(null)
                  setStep('upload')
                  setFile(null)
                  if (previewUrl) URL.revokeObjectURL(previewUrl)
                  setPreviewUrl(null)
                  setMultiFiles([])
                  multiPreviewUrls.forEach((u) => u.startsWith('blob:') && URL.revokeObjectURL(u))
                  setMultiPreviewUrls([])
                  setUploadedImageUrls([])
                }}
                variant="ghost"
                className="rounded-full"
              >
                Start over
              </Button>
              <Link href="/" className={cn(getButtonClassName('ghost', 'default', 'rounded-full'), 'inline-flex')}>
                Back to home
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
