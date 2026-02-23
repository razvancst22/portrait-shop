import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { PricingPlanCards } from '@/components/pricing/pricing-plan-cards'
import { PortraitUpgradeCards } from '@/components/pricing/portrait-upgrade-cards'

export const metadata: Metadata = {
  title: 'Pricing – Create Unlimited Classic Art Portraits From Your Photos',
  description: 'Create stunning Renaissance, Baroque, and Victorian portraits from your photos. Free preview available • One price for everything • High-resolution downloads.',
}

const COMPARE_FEATURES = [
  { feature: 'Portrait Generations', starter: '5', creator: '20', artist: '50' },
  { feature: 'High Res Downloads', starter: '1', creator: '10', artist: '50' },
  { feature: 'Price per Artwork', starter: '—', creator: '$4.99', artist: '$2.37' },
  { feature: 'Lifetime Access', starter: true, creator: true, artist: true },
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
          Create Unlimited Classic Art Portraits
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto">
          Choose from 19 stunning art styles. Free preview • High-resolution downloads • No subscription required.
        </p>
      </section>

      {/* Digital Packs */}
      <section className="px-4 pb-14 md:pb-20">
        <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-2 text-center">
          Digital Packs
        </h2>
        <p className="text-muted-foreground text-center text-sm md:text-base mb-8 max-w-2xl mx-auto">
          Bundle portrait generations and high-res downloads. Sign in required.
        </p>
        <PricingPlanCards />
      </section>

      {/* Get your Portrait + Art Print Pack – upgrades for generated portraits */}
      <section className="px-4 pb-14 md:pb-20">
        <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-2 text-center">
          Upgrade Your Portrait
        </h2>
        <p className="text-muted-foreground text-center text-sm md:text-base mb-8 max-w-2xl mx-auto">
          Already generated a portrait? Get the 4K download or order a museum-quality print.
        </p>
        <PortraitUpgradeCards />
      </section>

      {/* Compare Plans */}
      <section className="px-4 pb-16 md:pb-24">
        <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-8 text-center">
          Compare Digital Packs
        </h2>
        <div className="max-w-4xl mx-auto overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 font-semibold text-foreground">Features</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center">Starter</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center">Creator</th>
                <th className="py-3 px-4 font-semibold text-foreground text-center">Artist</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_FEATURES.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? 'bg-muted/40' : ''}>
                  <td className="py-3 px-4 text-foreground">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.starter === 'boolean' ? (
                      row.starter ? <Check className="inline-block size-4 text-primary" /> : '—'
                    ) : (
                      row.starter
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.creator === 'boolean' ? (
                      row.creator ? <Check className="inline-block size-4 text-primary" /> : '—'
                    ) : (
                      row.creator
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof row.artist === 'boolean' ? (
                      row.artist ? <Check className="inline-block size-4 text-primary" /> : '—'
                    ) : (
                      row.artist
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
