import Link from 'next/link'
import { getButtonClassName } from '@/components/primitives/button'
import { PageContainer } from '@/components/layout/page-container'

export const metadata = {
  title: 'Contact – petportrait.shop',
  description: 'Contact petportrait.shop',
}

export default function ContactPage() {
  return (
    <PageContainer maxWidth="md" padding="md">
      <h1 className="font-heading text-2xl font-semibold text-foreground mb-4">
        Contact
      </h1>
      <p className="text-muted-foreground mb-6">
        For support or questions about your order, use the{' '}
        <Link href="/order-lookup" className="text-primary underline hover:no-underline">
          Order lookup
        </Link>{' '}
        page to get a new download link. For other inquiries, email support at your domain (e.g. support@petportrait.shop).
      </p>
      <Link href="/" className={getButtonClassName('outline', 'sm', 'rounded-full')}>
        Back to home
      </Link>
    </PageContainer>
  )
}
