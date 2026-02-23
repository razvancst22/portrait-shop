import Link from 'next/link'
import { getButtonClassName } from '@/components/primitives/button'

export const metadata = {
  title: 'Commercial License – Use Your Portrait for Business & Marketing',
  description: 'Learn about commercial licensing options for Portret digital portraits. Use your classic art portrait for business, marketing, and merchandise.',
}

export default function CommercialPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold text-foreground mb-4">
        Commercial Use
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-6 text-sm">
        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">1. Personal vs Commercial Use</h2>
          <p>
            By default, when you purchase a digital portrait from Portret, you receive a non-exclusive license
            to use the delivered files for <strong className="text-foreground">personal, non-commercial use</strong> only.
            This includes use at home, as gifts, on personal social media (non-promotional), and similar private uses.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">2. What Counts as Commercial Use</h2>
          <p>
            Commercial use includes, but is not limited to: selling or licensing the portrait (e.g. prints, merchandise,
            stock art); using it in advertising, marketing, or branding; using it in a business logo or product; using it
            in paid content, books, or media; or any use that generates revenue or promotes a business or brand.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">3. Commercial Use Requires Permission</h2>
          <p>
            If you wish to use your Portret portrait for any commercial purpose, you must obtain our prior
            written permission. Contact us via the Contact page with: your order number, a short description of the
            intended use (e.g. “print on mugs to sell in my shop”), and the scope (e.g. territory, duration). We may
            grant a commercial license subject to terms and possibly an additional fee.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">4. What You May Not Do</h2>
          <p>
            You may not, without our written permission: resell or sublicense the portrait; use it to train AI or machine-learning
            models; use it in a way that suggests endorsement by Portret; or use it for any illegal or
            defamatory purpose. Unauthorized commercial use may result in revocation of your license and possible
            legal action.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">5. Ownership</h2>
          <p>
            We (or our licensors) retain ownership of the underlying design, style, and generation process. You own
            the photo you uploaded. The generated portrait is provided under license as set out in our Terms of Service
            and this page, not as a transfer of ownership.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">6. Contact</h2>
          <p>
            For commercial use requests or questions, use the Contact page.
          </p>
        </section>
      </div>

      <div className="mt-10">
        <Link href="/" className={getButtonClassName('outline', 'sm', 'rounded-full')}>
          Back to home
        </Link>
      </div>
    </div>
  )
}
