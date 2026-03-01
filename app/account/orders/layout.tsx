import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Order History',
  description: 'View your orders and download your portraits.',
}

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
