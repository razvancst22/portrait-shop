import type { Metadata } from 'next'
import Link from 'next/link'
import { CATEGORY_ROUTES, SUBJECT_TYPE_IDS } from '@/lib/prompts/artStyles'
import { getButtonClassName } from '@/components/primitives/button'

export const metadata: Metadata = {
  title: 'Classic Portraits for Pets, Family, Couples & More | petportrait.shop',
  description:
    'Turn your photos into Renaissance, Baroque, and Victorian masterpieces. Pet portraits, family portraits, couple portraits, children, and self-portraits. Free preview, one price.',
  openGraph: {
    title: 'Classic Portraits for Pets, Family, Couples & More | petportrait.shop',
    description: 'Turn your photos into Renaissance, Baroque, and Victorian masterpieces. Pet, family, couple, children, self-portraits.',
    url: '/',
  },
}

const CATEGORY_ICONS: Record<string, string> = {
  pet: '🐕',
  family: '👨‍👩‍👧‍👦',
  children: '👧',
  couple: '💑',
  self: '🖼️',
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 md:py-24">
      <main className="max-w-3xl w-full text-center">
        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3 animate-fade-in-up">
          Classic portraits, your way
        </h1>
        <p className="text-muted-foreground mb-12 text-lg animate-fade-in animate-fade-in-delay-1">
          Turn your photos into timeless art. Choose a category, upload a photo, pick a style—Renaissance, Baroque, Victorian, and more. Free preview, one fixed price for your digital bundle.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in animate-fade-in-delay-2">
          {SUBJECT_TYPE_IDS.map((id) => {
            const route = CATEGORY_ROUTES[id]
            return (
              <Link
                key={id}
                href={route.path}
                className={getButtonClassName('outline', 'lg', 'h-auto flex flex-col items-center justify-center gap-2 py-6 rounded-xl text-left hover:border-primary/50 hover:bg-muted/30')}
              >
                <span className="text-4xl" aria-hidden>{CATEGORY_ICONS[id] ?? '🖼️'}</span>
                <span className="font-semibold text-foreground">{route.title}</span>
                <span className="text-sm text-muted-foreground font-normal">
                  {id === 'pet' && 'Dogs, cats, and more'}
                  {id === 'family' && 'Group portraits'}
                  {id === 'children' && 'Child portraits'}
                  {id === 'couple' && 'Two people'}
                  {id === 'self' && 'Your portrait'}
                </span>
              </Link>
            )
          })}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          No credit card for preview. Same image in high resolution when you purchase—no re-generation, no surprises.
        </p>
      </main>
    </div>
  )
}
