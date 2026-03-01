'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/providers/auth-provider'
import { useCreditsUpdateListener } from '@/lib/credits-events'
import { UploadPhotoArea } from '@/components/upload-photo-area'
import { AddCreditsModal } from '@/components/add-credits-modal'
import { CategoryDropdown } from '@/components/category-dropdown'
import { StyleCardGrid } from '@/components/style-card-grid'
import { Button } from '@/components/primitives/button'
import { ART_STYLE_IDS, CATEGORY_ROUTES, SUBJECT_TYPE_IDS, type SubjectTypeId } from '@/lib/prompts/artStyles'
import { CREATE_FLOW_COPY } from '@/lib/create-flow-config'
import { compressImageForUpload } from '@/lib/image/compress-upload'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_MB = 10

const SUBTITLE_MESSAGES = (tokens: number) => [
  'Use a well-lit photo',
  `${tokens} free portrait${tokens !== 1 ? 's' : ''} · No sign-in required`,
  'JPEG, PNG or WebP · Max 10MB',
]

/**
 * Upload option on the main page. Do not remove – must stay on the home page.
 * User uploads here; "Pick Style" opens a modal with all styles. After upload,
 * user picks a style in the modal to generate; then redirect to preview page.
 * When 0 tokens, click opens sign-up / buy-Portrait-Generations modal.
 */
function getCategoryFromPathname(pathname: string | null): SubjectTypeId {
  if (!pathname) return 'pet'
  const match = SUBJECT_TYPE_IDS.find((id) => CATEGORY_ROUTES[id].path === pathname)
  return match ?? 'pet'
}

export function UploadSection() {
  const router = useRouter()
  const pathname = usePathname()
  const currentCategory = getCategoryFromPathname(pathname ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generatingRef = useRef(false)
  const [tokens, setTokens] = useState<number | null>(null)
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleChangePhoto = useCallback(() => {
    setUploadedImageUrl(null)
    setUploadError(null)
    setSelectedStyle(null)
    setGenerateError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleStyleSelect = useCallback((styleId: string) => {
    setSelectedStyle(styleId)
  }, [])

  const handleCreateArtwork = useCallback(async () => {
    if (!uploadedImageUrl || !selectedStyle) return
    if (generatingRef.current) return
    generatingRef.current = true
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          artStyle: selectedStyle,
          subjectType: currentCategory,
          idempotencyKey: `create-${crypto.randomUUID()}`,
        }),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 403 && (err.code === 'INSUFFICIENT_CREDITS' || err.code === 'FREE_CAP_30_DAYS')) {
          setGenerateError(err.error ?? "You've used your free portraits. Sign in or buy Portrait Generations.")
          setShowAddCreditsModal(true)
        } else {
          setGenerateError(err.error || `Generation failed: ${res.status}`)
        }
        return
      }
      const { generationId } = await res.json()
      setUploadedImageUrl(null)
      setSelectedStyle(null)
      router.push(`/preview/${generationId}`)
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
      generatingRef.current = false
    }
  }, [uploadedImageUrl, selectedStyle, currentCategory, router])

  const fetchCredits = useCallback(() => {
    fetch('/api/credits', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setTokens(d.balance ?? null))
      .catch(() => setTokens(null))
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits, user])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchCredits()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchCredits])

  useCreditsUpdateListener(fetchCredits)

  useEffect(() => {
    if (uploadedImageUrl && !selectedStyle) {
      setSelectedStyle(ART_STYLE_IDS[0])
    }
  }, [uploadedImageUrl, selectedStyle])

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file || tokens === 0) return
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError('Please use JPEG, PNG or WebP.')
        return
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setUploadError(`File must be under ${MAX_MB}MB.`)
        return
      }
      setUploadError(null)
      setUploading(true)
      try {
        const { file: fileToUpload } = await compressImageForUpload(file)
        const formData = new FormData()
        formData.append('file', fileToUpload)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const message =
            res.status === 413
              ? 'Photo is too large. Please choose a smaller image or take a new photo.'
              : (err.error || `Upload failed: ${res.status}`)
          throw new Error(message)
        }
        const { imageUrl } = await res.json()
        setUploadedImageUrl(imageUrl)
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Upload failed.')
      } finally {
        setUploading(false)
      }
    },
    [tokens]
  )

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFile(e.target.files?.[0] ?? null)
      e.target.value = ''
    },
    [handleFile]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFile(e.dataTransfer.files?.[0] ?? null)
    },
    [handleFile]
  )
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const subtitle =
    tokens === null
      ? 'Start with a pet portrait – 2 free portraits, no sign-in required'
      : tokens === 0
        ? '0 free portraits · No sign-in required'
        : SUBTITLE_MESSAGES(tokens)

  return (
    <section className="w-full max-w-3xl mx-auto mb-10 animate-fade-in animate-fade-in-delay-2" aria-label="Start creating">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={onFileChange}
        className="hidden"
        id="home-upload-photo"
        disabled={tokens === 0 || uploading}
      />
      {uploadedImageUrl ? (
        <div className="flex flex-col w-full animate-fade-in">
          <div className="flex items-center justify-between gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full -ml-2"
              onClick={handleChangePhoto}
              disabled={generating}
              type="button"
            >
              ← Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handleChangePhoto}
              disabled={generating}
              type="button"
            >
              Change photo
            </Button>
          </div>
          <p className="text-sm font-medium text-foreground mb-3 text-center">
            {generating ? 'Creating your portrait…' : 'Choose a style, then create your artwork.'}
          </p>
          <div className="relative aspect-[4/5] w-full max-w-[220px] mx-auto rounded-2xl overflow-hidden bg-muted/50 border border-white/20 dark:border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_4px_16px_rgba(0,0,0,0.12)] mb-6">
            <Image src={uploadedImageUrl} alt="Your upload" fill className="object-cover object-center" unoptimized />
            {generating && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-md">
                <span className="text-sm font-medium">Creating…</span>
              </div>
            )}
          </div>
          <StyleCardGrid
            selectedStyle={selectedStyle ?? undefined}
            onStyleSelect={handleStyleSelect}
            disabled={generating}
            className="mb-4"
          />
          <Button
            onClick={handleCreateArtwork}
            disabled={!selectedStyle || generating}
            className="w-full rounded-full"
            size="lg"
          >
            Create your artwork
          </Button>
          {generateError && (
            <p className="mt-3 text-sm text-destructive text-center" role="alert">
              {generateError}
            </p>
          )}
        </div>
      ) : tokens === 0 ? (
        <UploadPhotoArea
          creditsCount={0}
          creditsLabel="Portrait Generation"
          uploadTitle={CREATE_FLOW_COPY[currentCategory].uploadLabel}
          subtitle={subtitle}
          subtitleRotateIntervalMs={0}
          as="button"
          onClick={() => setShowAddCreditsModal(true)}
          onAddCredits={() => setShowAddCreditsModal(true)}
          disabled={false}
          styleSelector={
            <CategoryDropdown currentCategory={currentCategory} disabled={false} />
          }
        />
      ) : (
        <UploadPhotoArea
          creditsCount={tokens}
          creditsLabel="Portrait Generation"
          uploadTitle={
            uploading ? 'Uploading…' : CREATE_FLOW_COPY[currentCategory].uploadLabel
          }
          subtitle={uploading ? 'One moment…' : subtitle}
          subtitleRotateIntervalMs={uploading ? 0 : Array.isArray(subtitle) ? 4000 : 0}
          as="label"
          htmlFor="home-upload-photo"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          disabled={uploading}
          styleSelector={
            <CategoryDropdown currentCategory={currentCategory} disabled={uploading} />
          }
        />
      )}
      {uploadError && (
        <p className="mt-3 text-sm text-destructive text-center" role="alert">
          {uploadError}
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
    </section>
  )
}
