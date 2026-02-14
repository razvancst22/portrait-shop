import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing – Buy credits | petportrait.shop',
  description: 'Get more portrait credits. Sign in or buy a pack to create more classic portraits.',
}

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 md:py-24">
      <main className="max-w-2xl w-full text-center">
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Pricing
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Buy credits to create more portraits. Pricing options will be available here soon.
        </p>
        <Link
          href="/"
          className="text-primary font-medium underline"
        >
          Back to home
        </Link>
      </main>
    </div>
  )
}
