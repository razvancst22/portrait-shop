import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Order Lookup",
  description:
    "Lost your download link? Enter order number and email to retrieve it.",
}

export default function OrderLookupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
