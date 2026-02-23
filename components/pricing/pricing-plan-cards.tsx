'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/primitives/card'
import { getButtonClassName } from '@/components/primitives/button'
import { Check } from 'lucide-react'
import { DIGITAL_PACKS } from '@/lib/pricing/constants'

type HoveredPack = 'starter' | 'creator' | 'artist' | null

export function PricingPlanCards() {
  const [hoveredPack, setHoveredPack] = useState<HoveredPack>(null)
  const isCreatorDimmed = hoveredPack === 'starter' || hoveredPack === 'artist'

  return (
    <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
      {/* Card 1: Starter Pack */}
      <Card
        className="group flex flex-col h-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary hover:shadow-lg"
        onMouseEnter={() => setHoveredPack('starter')}
        onMouseLeave={() => setHoveredPack(null)}
      >
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-heading text-xl md:text-2xl">Starter Pack</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums">
              <span className="text-lg align-top">$</span>
              {DIGITAL_PACKS.starter.priceUsd}
            </p>
          </div>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{DIGITAL_PACKS.starter.generations} Portrait Generations</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>1 High Res Portrait Download</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>Lifetime access to your artworks</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Link
            href="/checkout?pack=starter"
            className={`${getButtonClassName('secondary', 'lg', 'w-full')} group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20 group-hover:-translate-y-0.5`}
          >
            Get Starter Pack
          </Link>
        </CardFooter>
      </Card>

      {/* Card 2: Creator Pack – featured, matches unselected style when another pack is hovered */}
      <Card
        className={`flex flex-col h-full overflow-hidden transition-all duration-200 ${
          isCreatorDimmed ? 'ring-0' : 'ring-2 ring-primary'
        } hover:shadow-lg`}
        onMouseEnter={() => setHoveredPack('creator')}
        onMouseLeave={() => setHoveredPack(null)}
      >
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-heading text-xl md:text-2xl">Creator Pack</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums">
              <span className="text-lg align-top">$</span>
              {DIGITAL_PACKS.creator.priceUsd}
            </p>
          </div>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{DIGITAL_PACKS.creator.generations} Portrait Generations</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{DIGITAL_PACKS.creator.highResDownloads} High Res Portrait Download</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>${DIGITAL_PACKS.creator.pricePerArtwork} per artwork</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>Lifetime access</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Link
            href="/checkout?pack=creator"
            className={
              isCreatorDimmed
                ? getButtonClassName('secondary', 'lg', 'w-full')
                : getButtonClassName('default', 'lg', 'w-full')
            }
          >
            Get Creator Pack
          </Link>
        </CardFooter>
      </Card>

      {/* Card 3: Artist Pack */}
      <Card
        className="group flex flex-col h-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary hover:shadow-lg"
        onMouseEnter={() => setHoveredPack('artist')}
        onMouseLeave={() => setHoveredPack(null)}
      >
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-heading text-xl md:text-2xl">Artist Pack</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums">
              <span className="text-lg align-top">$</span>
              {DIGITAL_PACKS.artist.priceUsd}
            </p>
          </div>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{DIGITAL_PACKS.artist.generations} Portrait Generations</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>{DIGITAL_PACKS.artist.highResDownloads} High Res Portrait Download</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>${DIGITAL_PACKS.artist.pricePerArtwork} per artwork</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>Lifetime access</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Link
            href="/checkout?pack=artist"
            className={`${getButtonClassName('secondary', 'lg', 'w-full')} group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20 group-hover:-translate-y-0.5`}
          >
            Get Artist Pack
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
