import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cart – Complete Your Classic Art Portrait Purchase',
  description: 'Ready to own your masterpiece? Complete checkout to download your high-resolution Renaissance, Baroque, or Victorian portrait instantly.',
}

export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
