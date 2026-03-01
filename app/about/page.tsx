import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { SITE_NAME, BRANDING_MESSAGE } from '@/lib/site-config'

export const metadata = {
  title: `About – ${SITE_NAME}`,
  description: `Learn about ${SITE_NAME}. ${BRANDING_MESSAGE}. Custom AI-generated pet portraits and personalized artwork.`,
}

export default function AboutPage() {
  return (
    <PageContainer maxWidth="md" padding="md">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="font-heading text-2xl font-semibold text-foreground mb-4">
        About {SITE_NAME}
      </h1>
      <div className="prose prose-invert prose-sm max-w-none text-muted-foreground space-y-4">
        <p>
          {BRANDING_MESSAGE}. We create custom AI-generated portraits for pets, families, couples, and more.
        </p>
        <p>
          Our portraits blend artistic styles with your photos to produce timeless artwork. Each piece is crafted with care, whether it&apos;s a beloved pet, a family moment, or a special portrait for yourself.
        </p>
        <p>
          We believe in making personalized art accessible. Upload your photos, choose a style, and receive a free preview before you decide to download or order a print.
        </p>
      </div>
      <div className="mt-8">
        <Link
          href="/"
          className="text-primary underline hover:no-underline font-medium text-sm"
        >
          Create your portrait →
        </Link>
      </div>
    </PageContainer>
  )
}
