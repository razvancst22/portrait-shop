'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { UploadPhotoArea } from '@/components/upload-photo-area'
import { OutOfCreditsModal } from '@/components/out-of-credits-modal'
import { StyleSelector } from '@/components/style-selector'
import { Button } from '@/components/primitives/button'

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
export function UploadSection() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tokens, setTokens] = useState<number | null>(null)
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const handleChangePhoto = useCallback(() => {
    setUploadedImageUrl(null)
    setUploadError(null)
    setSelectedStyle(null)
    setGenerateError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleStyleSelect = useCallback(async (styleId: string) => {
    if (!uploadedImageUrl) {
      setSelectedStyle(styleId)
      return
    }

    setGenerating(true)
    setGenerateError(null)
    setSelectedStyle(styleId)
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          artStyle: styleId,
          subjectType: 'pet',
        }),
        credentials: 'include',
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 403 && err.code === 'INSUFFICIENT_CREDITS') {
          setGenerateError(err.error ?? "You've used your free portraits. Sign in or buy Portrait Generations.")
          setShowOutOfCreditsModal(true)
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
    }
  }, [uploadedImageUrl, router])

  const fetchCredits = useCallback(() => {
    fetch('/api/credits', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setTokens(d.balance ?? null))
      .catch(() => setTokens(null))
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCredits()
    })
    return () => subscription.unsubscribe()
  }, [fetchCredits])

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
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Upload failed: ${res.status}`)
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
        <div className="flex flex-col items-center text-center animate-fade-in">
          <p className="text-sm font-medium text-foreground mb-2">
            {generating ? 'Creating your portrait...' : 'Photo uploaded. Pick a style to create your portrait.'}
          </p>
          <div className="relative aspect-[4/5] w-40 rounded-xl overflow-hidden bg-muted mb-3">
            <Image src={uploadedImageUrl} alt="Your upload" fill className="object-cover object-center" unoptimized />
            {generating && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <span className="text-sm font-medium">Creating…</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 justify-center items-center">
            <StyleSelector
              selectedStyle={selectedStyle || undefined}
              onStyleSelect={handleStyleSelect}
              disabled={generating}
              className="mb-0"
            />
            <Button
              onClick={handleChangePhoto}
              variant="outline"
              className="rounded-full"
              size="lg"
              type="button"
              disabled={generating}
            >
              Change photo
            </Button>
          </div>
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
          uploadTitle="Upload your photo"
          subtitle={subtitle}
          subtitleRotateIntervalMs={0}
          as="button"
          onClick={() => setShowOutOfCreditsModal(true)}
          disabled={false}
          styleSelector={
            <StyleSelector
              selectedStyle={selectedStyle || undefined}
              onStyleSelect={handleStyleSelect}
              disabled={true}
            />
          }
        />
      ) : (
        <UploadPhotoArea
          creditsCount={tokens}
          creditsLabel="Portrait Generation"
          uploadTitle={uploading ? 'Uploading…' : 'Upload your photo'}
          subtitle={uploading ? 'One moment…' : subtitle}
          subtitleRotateIntervalMs={uploading ? 0 : Array.isArray(subtitle) ? 4000 : 0}
          as="label"
          htmlFor="home-upload-photo"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          disabled={uploading}
          styleSelector={
            <StyleSelector
              selectedStyle={selectedStyle || undefined}
              onStyleSelect={handleStyleSelect}
              disabled={uploading}
            />
          }
        />
      )}
      {uploadError && (
        <p className="mt-3 text-sm text-destructive text-center" role="alert">
          {uploadError}
        </p>
      )}
      <OutOfCreditsModal open={showOutOfCreditsModal} onClose={() => setShowOutOfCreditsModal(false)} />
    </section>
  )
}
