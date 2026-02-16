import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cart | petportrait.shop',
  description: 'Portraits ready to purchase. Complete checkout for high-resolution downloads.',
}

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
