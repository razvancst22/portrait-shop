'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/primitives/card'
import { getButtonClassName } from '@/components/primitives/button'
import { Check } from 'lucide-react'
import { GET_YOUR_PORTRAIT_PRICE_USD, ART_PRINT_OPTIONS } from '@/lib/pricing/constants'

/**
 * Get your Portrait + Art Print Pack – upgrades for already generated portraits.
 * Shown side by side since both require a generation to exist.
 */
export function PortraitUpgradeCards() {
  const [artPrintOption, setArtPrintOption] = useState<(typeof ART_PRINT_OPTIONS)[number]>(ART_PRINT_OPTIONS[0])

  return (
    <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2">
      {/* Get your Portrait */}
      <Card className="group flex flex-col h-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary hover:shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-heading text-xl md:text-2xl">Get your Portrait</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <p className="text-3xl md:text-4xl font-heading font-semibold tabular-nums text-center">
            <span className="text-lg align-top">$</span>
            {GET_YOUR_PORTRAIT_PRICE_USD}
          </p>
          <ul className="space-y-2.5 text-sm text-foreground">
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>Upgrade to 4K</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>No watermark</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Link
            href="/create"
            className={`${getButtonClassName('default', 'lg', 'w-full')} group-hover:shadow-lg group-hover:shadow-primary/25`}
          >
            Create portrait first
          </Link>
        </CardFooter>
      </Card>

      {/* Art Print Pack – same styling as Get your Portrait */}
      <Card className="group flex flex-col h-full overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary hover:shadow-lg">
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
                  {opt.dimensions}
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
              <span>Museum quality print</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>Last over 100 years</span>
            </li>
            <li className="flex gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <span>Free shipping worldwide</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4">
          <Link
            href={`/create?print=${encodeURIComponent(artPrintOption.dimensions)}`}
            className={`${getButtonClassName('default', 'lg', 'w-full')} group-hover:shadow-lg group-hover:shadow-primary/25`}
          >
            Get Art Print Pack
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
