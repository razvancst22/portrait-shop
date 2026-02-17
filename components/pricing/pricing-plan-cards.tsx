'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/primitives/card'
import { getButtonClassName } from '@/components/primitives/button'
import { Check } from 'lucide-react'

const ART_PRINT_OPTIONS = [
  { dimensions: '8×10"', price: 89 },
  { dimensions: '12×16"', price: 119 },
  { dimensions: '18×24"', price: 199 },
  { dimensions: '24×36"', price: 299 },
] as const

export function PricingPlanCards() {
  const [artPrintOption, setArtPrintOption] = useState<(typeof ART_PRINT_OPTIONS)[number]>(ART_PRINT_OPTIONS[0])

  return (
    <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
      {/* Card 1: Portrait Pack */}
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-heading text-xl md:text-2xl">Portrait Pack</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums">
              <span className="text-lg align-top">$</span>20
            </p>
          </div>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>5 Credits</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>1 High Res Downloadable ready to print</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>Lifetime access to your portrait</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Link href="/checkout" className={getButtonClassName('secondary', 'lg', 'w-full')}>
            Get Portrait Pack
          </Link>
        </CardFooter>
      </Card>

      {/* Card 2: Creator Pack */}
      <Card className="flex flex-col h-full overflow-hidden ring-2 ring-primary transition-all duration-200 hover:shadow-lg hover:ring-primary/90">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-heading text-xl md:text-2xl">Creator Pack</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums">
              <span className="text-lg align-top">$</span>69
            </p>
          </div>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>10 Credits</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>10 High Res Downloadable ready to print</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>Lifetime access to your portraits</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Link href="/checkout" className={getButtonClassName('default', 'lg', 'w-full')}>
            Get Creator Pack
          </Link>
        </CardFooter>
      </Card>

      {/* Card 3: Art Print Pack */}
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/30">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-heading text-xl md:text-2xl">Art Print Pack</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="space-y-3">
            <label htmlFor="art-print-size" className="text-sm font-medium text-foreground block">
              Print size
            </label>
            <select
              id="art-print-size"
              value={artPrintOption.dimensions}
              onChange={(e) => {
                const option = ART_PRINT_OPTIONS.find((o) => o.dimensions === e.target.value)
                if (option) setArtPrintOption(option)
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              {ART_PRINT_OPTIONS.map((opt) => (
                <option key={opt.dimensions} value={opt.dimensions}>
                  {opt.dimensions} – ${opt.price}
                </option>
              ))}
            </select>
            <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums text-center">
              <span className="text-lg align-top">$</span>
              {artPrintOption.price}
            </p>
          </div>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>10 credits – Creator pack included</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Link
            href={`/checkout?print=${encodeURIComponent(artPrintOption.dimensions)}`}
            className={getButtonClassName('secondary', 'lg', 'w-full')}
          >
            Get Art Print Pack
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}