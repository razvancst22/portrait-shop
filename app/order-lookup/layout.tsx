import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order lookup – petportrait.shop',
  description: 'Get a new download link for your portrait bundle. Enter your order number and email.',
}

export default function OrderLookupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
