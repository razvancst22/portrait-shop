import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/primitives/card'
import { getButtonClassName } from '@/components/primitives/button'
import { Check } from 'lucide-react'
import { PricingPlanCards } from '@/components/pricing/pricing-plan-cards'

export const metadata: Metadata = {
  title: 'Pricing – Choose Your Package | petportrait.shop',
  description: 'Unlock premium styles and create unlimited masterpieces. Pay per portrait or get art prints.',
}

const PAY_PER_PORTRAIT = [
  { title: 'Pet Portrait', description: 'Single pet image upload', price: 20, badge: null },
  { title: 'Family Portrait', description: 'Family & multi-image uploads', price: 20, badge: null },
  { title: 'Children Portrait', description: 'Child portrait from your photo', price: 20, badge: null },
  { title: 'Couple Portrait', description: 'Two people, one portrait', price: 20, badge: null },
  { title: 'Self Portrait', description: 'Your own classic portrait', price: 20, badge: null },
]

const ART_PRINT_SIZES = [
  { size: '8×10"', price: 89 },
  { size: '12×16"', price: 119 },
  { size: '18×24"', price: 199 },
  { size: '24×36"', price: 299 },
]

const COMPARE_FEATURES = [
  { feature: 'Portrait Generations', digital: '5', starter: '10', studio: '60' },
  { feature: 'Downloads', digital: '2', starter: '10', studio: 'Unlimited' },
  { feature: 'Art Styles', digital: '1 style', starter: '6 styles', studio: 'All 19 styles' },
  { feature: 'Watermark', digital: 'Yes', starter: 'No', studio: 'No' },
  { feature: 'Retry Tools', digital: true, starter: true, studio: true },
  { feature: 'Precision Editor - Simple', digital: false, starter: true, studio: true },
  { feature: 'Advanced Precision Editor', digital: false, starter: false, studio: true },
  { feature: 'Price per Portrait Generation', digital: '$5.80', starter: '$4.90', studio: '$3.32' },
  { feature: 'Commercial use', digital: false, starter: true, studio: true },
]

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      {/* Trust bar */}
      <section className="border-b border-border bg-muted/30 py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-muted-foreground px-4 min-w-0">
          <span className="truncate max-w-[50vw] sm:max-w-none">Free shipping on prints</span>
          <span>Rated 4.8 ★</span>
        </div>
      </section>

      {/* Hero */}
      <section className="text-center px-4 pt-12 pb-10 md:pt-16 md:pb-14">
        <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-3">
          Choose Your Package
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
          Unlock premium styles and create unlimited masterpieces
        </p>
      </section>

      {/* Three plan cards */}
      <section className="px-4 pb-14 md:pb-20">
        <PricingPlanCards />
      </section>

      {/* Pay-Per-Portrait */}
      <section className="px-4 pb-14 md:pb-20">
        <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-2 text-center">
          Pay-Per-Portrait
        </h2>
        <p className="text-muted-foreground text-center text-sm md:text-base mb-8 max-w-lg mx-auto">
          Don&apos;t need a pack? Purchase individual portraits at these prices.
        </p>
        <div className="max-w-4xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PAY_PER_PORTRAIT.map((item) => (
            <Card key={item.title} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  {item.badge && (
                    <span className="rounded bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <span className="text-2xl font-heading font-semibold">${item.price}</span>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/create" className={getButtonClassName('default', 'lg', 'w-full')}>
                  Get started
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground text-center text-sm mt-6">
          High-resolution download • No watermark • Commercial use rights
        </p>
      </section>

      {/* Art Print Pricing */}
      <section className="px-4 pb-14 md:pb-20">
        <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-2 text-center">
          Art Print Pricing
        </h2>
        <p className="text-muted-foreground text-center text-sm md:text-base mb-8 max-w-2xl mx-auto">
          Museum-quality archival prints on premium matte art paper using fade-resistant inks. Not photo prints — these
          are fine art reproductions built to last generations.
        </p>
        <div className="max-w-4xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ART_PRINT_SIZES.map(({ size, price }) => (
            <Card key={size} className="text-center">
              <CardHeader className="pb-1">
                <CardTitle className="text-lg font-medium">{size}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-2xl font-heading font-semibold">${price}</p>
              </CardContent>
              <CardFooter className="pt-0 justify-center">
                <Link href="/create" className={getButtonClassName('outline', 'sm')}>
                  Order print
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground text-center text-sm mt-6">
          Free worldwide shipping • Printed in the EU
        </p>
      </section>

      {/* Compare Plans */}
      <section className="px-4 pb-16 md:pb-24">
        <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-8 text-center">
          Compare Plans
        </h2>
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 font-semibold text-foreground">Features</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center">Digital</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center">Starter</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center">Studio</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_FEATURES.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-muted/40' : ''}>
                  <td className="py-3 px-4 text-foreground">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.digital === 'boolean' ? (
                      row.digital ? <Check className="inline-block size-4 text-primary" /> : '—'
                    ) : (
                      row.digital
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.starter === 'boolean' ? (
                      row.starter ? <Check className="inline-block size-4 text-primary" /> : '—'
                    ) : (
                      row.starter
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.studio === 'boolean' ? (
                      row.studio ? <Check className="inline-block size-4 text-primary" /> : '—'
                    ) : (
                      row.studio
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Trust line */}
      <section className="border-t border-border bg-muted/30 py-8">
        <p className="text-center text-muted-foreground text-sm md:text-base">
          Over 1 million portraits made
        </p>
      </section>
    </div>
  )
}
