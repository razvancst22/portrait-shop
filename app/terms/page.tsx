import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for Portraitz custom portrait shop.",
}

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-6 text-sm">
        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">1. Agreement to Terms</h2>
          <p>
            By accessing or using Portret (“we”, “us”, “our”), you agree to be bound by these Terms of Service.
            If you do not agree, do not use our service. We provide AI-generated pet portraits and digital downloads.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">2. Description of Service</h2>
          <p>
            Portret allows you to upload a photo of your pet, choose an art style, and receive an AI-generated
            portrait. You may preview the result with a watermark and, upon purchase, receive a digital bundle (high-resolution
            image and additional formats) by email. No physical prints are included unless otherwise stated.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">3. Your Content and Conduct</h2>
          <p>
            You retain ownership of the photos you upload. You grant us a limited license to process, store, and use your
            images solely to provide the service (generation, preview, and delivery). You must not upload content that
            infringes others’ rights, is illegal, or that you do not have permission to use. We may remove content or
            suspend access if we believe it violates these terms or the law.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">4. Payment and Delivery</h2>
          <p>
            Payment is due when you purchase the digital bundle. Prices are shown before checkout. We use Stripe for
            payment processing. After payment, you will receive an email with a download link to your digital bundle.
            Links may expire after a set period; use the Order lookup page to request a new link if needed.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">5. Refunds</h2>
          <p>
            Our Refund Policy applies to all purchases. Please see the Refund Policy page for conditions and how to
            request a refund.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">6. Intellectual Property and Use</h2>
          <p>
            The portrait generated for you is created from your photo and our AI and styling. Subject to payment and
            these terms, we grant you a non-exclusive license to use the delivered digital files for personal use. For
            commercial use, see our Commercial Use page. You may not resell, sublicense, or use our service output to
            train AI models or create competing services.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">7. Disclaimer</h2>
          <p>
            The service and outputs are provided “as is”. We do not guarantee that results will meet any particular
            standard or that the service will be uninterrupted or error-free. We are not liable for indirect, incidental,
            or consequential damages arising from your use of the service.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">8. Changes</h2>
          <p>
            We may update these Terms from time to time. The “Last updated” date at the top will change. Continued use
            of the service after changes constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-foreground font-semibold mt-6 mb-2">9. Contact</h2>
          <p>
            For questions about these Terms, email us at support@portraitz.shop.
          </p>
        </section>
      </div>
    </div>
  )
}
