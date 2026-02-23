import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create portrait – Portret',
  description: 'Choose an art style, pick dog or cat, and upload a photo. We generate a preview for you to approve before purchase.',
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
