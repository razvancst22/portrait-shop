import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy – Portret',
  description: 'Privacy Policy for Portret',
}

export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 pt-4 md:pt-6 pb-8 md:pb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="font-heading text-2xl font-semibold text-foreground mb-4">
        Privacy Policy
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-6 text-sm">
        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">1. Who We Are</h2>
          <p>
            Portret (“we”, “us”) operates the pet portrait service. This Privacy Policy explains how we collect,
            use, and protect your information when you use our website and services.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">2. Information We Collect</h2>
          <p className="mb-2">We may collect:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Account/order data:</strong> email address, order number, and optionally pet name when you provide it.</li>
            <li><strong className="text-foreground">Photos:</strong> images you upload to create your portrait. These are processed to generate your portrait and are stored as needed for preview and delivery.</li>
            <li><strong className="text-foreground">Payment data:</strong> payment is processed by Stripe. We do not store your full card number; Stripe’s privacy policy applies to payment details.</li>
            <li><strong className="text-foreground">Technical data:</strong> IP address, browser type, device information, and usage data (e.g. pages visited) for operation and security.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">3. How We Use Your Information</h2>
          <p>
            We use your information to: provide the portrait service (generation, preview, delivery); process payments;
            send order and download links by email; respond to support requests; improve our service; and comply with
            legal obligations. We may use your email to send transactional messages and, where permitted, occasional
            updates about Portret; you can opt out of marketing at any time.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">4. Sharing and Processors</h2>
          <p>
            We do not sell your personal data. We share data only as needed with service providers who help us operate
            the service, such as: Stripe (payments), Resend or similar (email), Supabase (storage and database), and
            our AI/image generation provider. These processors are bound by agreements to protect your data and use it
            only for the purposes we specify.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">5. Retention</h2>
          <p>
            We retain your order and account-related data as long as needed to fulfill orders, provide download links,
            and comply with legal and accounting requirements. Uploaded and generated images may be stored for a limited
            period to deliver your bundle and resolve issues; we may delete them after delivery or after a set retention
            period.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">6. Security</h2>
          <p>
            We use industry-standard measures to protect your data (encryption in transit and at rest, access controls).
            No method of transmission or storage is 100% secure; we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">7. Your Rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct, delete, or port your personal data, or
            to object to or restrict certain processing. To exercise these rights or ask questions, contact us via the
            Contact page. You may also have the right to lodge a complaint with a supervisory authority.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">8. Cookies and Tracking</h2>
          <p>
            We use essential cookies and similar technologies to run the site (e.g. session, security). We may use
            analytics to understand how the site is used. You can control non-essential cookies through your browser
            settings.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">9. Children</h2>
          <p>
            Our service is not directed at children under 13. We do not knowingly collect personal data from children
            under 13. If you believe we have collected such data, please contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">10. Changes and Contact</h2>
          <p>
            We may update this Privacy Policy from time to time. The “Last updated” date will change. Continued use
            after changes constitutes acceptance. For privacy-related questions or requests, use the Contact page.
          </p>
        </section>
      </div>
    </div>
  )
}
