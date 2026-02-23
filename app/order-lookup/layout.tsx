import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Retrieve Your Portrait Download – Order Lookup',
  description: 'Lost your download link? Enter your order number and email to instantly receive a new download link for your classic art portrait.',
}

export default function OrderLookupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
