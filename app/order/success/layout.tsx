import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Thank You",
  description:
    "Order confirmed. Download link coming by email.",
}

export default function OrderSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
