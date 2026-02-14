import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Checkout – petportrait.shop',
  description: 'Complete your purchase securely. Enter your email to continue to payment.',
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
