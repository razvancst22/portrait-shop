import Link from 'next/link'
import { Separator } from '@/components/primitives/separator'
import { CATEGORY_ROUTES, SUBJECT_TYPE_IDS } from '@/lib/prompts/artStyles'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground" aria-label="Footer">
          {SUBJECT_TYPE_IDS.map((id) => (
            <Link key={id} href={CATEGORY_ROUTES[id].path} className="hover:text-foreground transition-colors">
              {CATEGORY_ROUTES[id].title}
            </Link>
          ))}
          <Link href="/order-lookup" className="hover:text-foreground transition-colors">
            Order lookup
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/refunds" className="hover:text-foreground transition-colors">
            Refunds
          </Link>
          <Link href="/commercial" className="hover:text-foreground transition-colors">
            Commercial use
          </Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>
        <Separator className="my-4" />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} petportrait.shop
        </p>
      </div>
    </footer>
  )
}
