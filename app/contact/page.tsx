import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getButtonClassName } from '@/components/primitives/button'
import { PageContainer } from '@/components/layout/page-container'

export const metadata = {
  title: 'Contact Support – Get Help With Your Classic Portrait Order',
  description: 'Need help with your portrait order? Contact our support team or use order lookup to retrieve your download link. Fast, friendly assistance.',
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ refund?: string; order?: string }>
}) {
  const params = await searchParams
  const isRefund = params.refund === '1'
  const orderNumber = params.order ?? ''

  return (
    <PageContainer maxWidth="md" padding="md">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <h1 className="font-heading text-2xl font-semibold text-foreground mb-4">
        Contact
      </h1>
      {isRefund && orderNumber ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6">
          <p className="font-medium text-foreground mb-1">Refund request for order {orderNumber}</p>
          <p className="text-sm text-muted-foreground mb-3">
            Include your order number and email in your message. See our{' '}
            <Link href="/refunds" className="text-primary underline hover:no-underline">
              Refund policy
            </Link>{' '}
            for eligibility.
          </p>
          <a
            href={`mailto:support@portraitz.shop?subject=Refund%20request%20${encodeURIComponent(orderNumber)}&body=Order%3A%20${encodeURIComponent(orderNumber)}%0A%0APlease%20explain%20your%20reason%20for%20the%20refund%20request%3A`}
            className={getButtonClassName('default', 'sm', 'rounded-full')}
          >
            Email support
          </a>
        </div>
      ) : null}
      <p className="text-muted-foreground mb-6">
        For support or questions about your order, use the{' '}
        <Link href="/order-lookup" className="text-primary underline hover:no-underline">
          Order lookup
        </Link>{' '}
        page to get a new download link. For other inquiries, email support at your domain (e.g. support@portraitz.shop).
      </p>
    </PageContainer>
  )
}
