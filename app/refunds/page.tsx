import Link from 'next/link'
import { getButtonClassName } from '@/components/primitives/button'

export const metadata = {
  title: 'Refund Policy – petportrait.shop',
  description: 'Refund policy for digital goods at petportrait.shop',
}

export default function RefundsPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold text-foreground mb-4">
        Refund Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-6 text-sm">
        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">1. Digital Products</h2>
          <p>
            petportrait.shop sells digital products only: AI-generated pet portraits delivered as a digital bundle (high-resolution
            image and additional formats) via email. Once you have received your download link and downloaded the files,
            the product has been delivered.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">2. When Refunds Are Considered</h2>
          <p>
            We may issue a refund in the following situations:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>You did not receive your download link or the link did not work, and we are unable to provide a working replacement.</li>
            <li>The delivered files were corrupted, incomplete, or clearly not the portrait you purchased (e.g. wrong image), and we cannot correct the delivery.</li>
            <li>You requested a refund before downloading the bundle and within the timeframe we specify (e.g. within 14 days of purchase), and we have not yet delivered a working link.</li>
          </ul>
          <p className="mt-2">
            Refunds are at our discretion. We are not required to refund if you have already downloaded the bundle and
            are simply unsatisfied with the artistic result, as you had the opportunity to view a preview before purchase.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">3. How to Request a Refund</h2>
          <p>
            Contact us via the Contact page with your order number and the email address used for the purchase. Explain
            the reason for your request. We will respond within a reasonable time and, if we approve a refund, process
            it to the original payment method. Refunds may take several business days to appear depending on your
            bank or card issuer.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">4. Chargebacks</h2>
          <p>
            If you dispute the charge with your bank or card issuer (chargeback) without first contacting us, we may
            provide evidence of delivery and our refund policy to the payment processor. We encourage you to contact
            us first so we can resolve the issue.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">5. Changes</h2>
          <p>
            We may update this Refund Policy from time to time. The “Last updated” date will change. The policy that
            applies to your purchase is the one in effect at the time of that purchase.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">6. Contact</h2>
          <p>
            For refund requests or questions, use the Contact page.
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
