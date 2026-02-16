import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Portraits | petportrait.shop',
  description: 'View your created portraits and purchase high-resolution downloads.',
}

export default function MyPortraitsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
