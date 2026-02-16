'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/primitives/button'
import { ART_STYLE_PROMPTS } from '@/lib/prompts/artStyles'
import type { ArtStyleId } from '@/lib/prompts/artStyles'
import { DIGITAL_BUNDLE_PRICE_USD } from '@/lib/constants'
import { ShoppingBag } from 'lucide-react'

type MyGenerationItem = {
  id: string
  art_style: string
  status: string
  preview_image_url: string | null
  is_purchased: boolean
  created_at: string
}

function styleDisplayName(artStyle: string): string {
  const id = artStyle as ArtStyleId
  return ART_STYLE_PROMPTS[id]?.name ?? artStyle
}

export default function CartPage() {
  const [generations, setGenerations] = useState<MyGenerationItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadGenerations = useCallback(() => {
    setLoading(true)
    fetch('/api/my-generations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setGenerations(d.generations ?? []))
      .catch(() => setGenerations([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadGenerations()
  }, [loadGenerations])

  const cartItems = generations.filter((g) => g.status === 'completed' && !g.is_purchased)
  const totalUsd = cartItems.length * DIGITAL_BUNDLE_PRICE_USD

  return (
    <div className="px-4 py-12 md:py-16">
      <main className="w-full max-w-2xl mx-auto text-left">
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-2 flex items-center gap-2">
          <ShoppingBag className="size-8 text-primary/80" />
          Cart
        </h1>
        <p className="text-muted-foreground mb-6">
          Completed portraits ready to purchase. Each item is ${DIGITAL_BUNDLE_PRICE_USD} for the high-resolution bundle.
        </p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/30 h-24 animate-pulse" />
            ))}
          </div>
        ) : cartItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <p className="text-sm text-muted-foreground mb-8">
              Create a portrait and come back to purchase the high-resolution download.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/my-portraits">
                <Button variant="outline" className="rounded-full w-full sm:w-auto">
                  View my portraits
                </Button>
              </Link>
              <span className="text-muted-foreground text-sm">or</span>
              <Link href="/">
                <Button className="rounded-full w-full sm:w-auto">Create portrait</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="space-y-4 mb-8">
              {cartItems.map((gen) => (
                <li
                  key={gen.id}
                  className="rounded-xl border border-border bg-card overflow-hidden flex flex-col sm:flex-row gap-4 p-0 sm:p-0 min-w-0"
                >
                  <Link
                    href={`/preview/${gen.id}`}
                    className="relative block w-full sm:w-24 aspect-[4/5] shrink-0 bg-muted overflow-hidden min-h-0"
                  >
                    {gen.preview_image_url ? (
                      <img
                        src={gen.preview_image_url}
                        alt=""
                        className="absolute inset-0 size-full object-cover object-center select-none pointer-events-none"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                        Preview
                      </div>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col justify-center p-4 sm:py-4 sm:pr-4 gap-2">
                    <p className="font-medium text-foreground">
                      {styleDisplayName(gen.art_style)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${DIGITAL_BUNDLE_PRICE_USD} – High-res bundle
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Link href={`/checkout?generationId=${gen.id}`}>
                        <Button size="sm" className="rounded-full">
                          Buy now
                        </Button>
                      </Link>
                      <Link href={`/preview/${gen.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-full">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-foreground font-medium">
                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} · ${totalUsd.toFixed(2)} total
              </p>
              <p className="text-sm text-muted-foreground">
                Checkout one at a time via &quot;Buy now&quot; above. You’ll enter your email on the next page.
              </p>
            </div>

            <p className="mt-6 text-center">
              <Link href="/my-portraits" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to my portraits
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  )
}
