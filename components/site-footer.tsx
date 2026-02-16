import Link from 'next/link'
import { Separator } from '@/components/primitives/separator'
import { CATEGORY_ROUTES, SUBJECT_TYPE_IDS } from '@/lib/prompts/artStyles'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container max-w-4xl mx-auto px-4 py-10">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground" aria-label="Footer">
          {SUBJECT_TYPE_IDS.map((id) => (
            <Link key={id} href={CATEGORY_ROUTES[id].path} className="hover:text-primary transition-colors duration-200">
              {CATEGORY_ROUTES[id].title}
            </Link>
          ))}
          <Link href="/order-lookup" className="hover:text-primary transition-colors duration-200">
            Order lookup
          </Link>
          <Link href="/pricing" className="hover:text-primary transition-colors duration-200">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-primary transition-colors duration-200">
            Log in
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors duration-200">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors duration-200">
            Privacy
          </Link>
          <Link href="/refunds" className="hover:text-primary transition-colors duration-200">
            Refunds
          </Link>
          <Link href="/commercial" className="hover:text-primary transition-colors duration-200">
            Commercial use
          </Link>
          <Link href="/contact" className="hover:text-primary transition-colors duration-200">
            Contact
          </Link>
        </nav>
        <Separator className="my-6" />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} petportrait.shop
        </p>
      </div>
    </footer>
  )
}
