import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Thank you – petportrait.shop',
  description: 'Your payment was successful. You will receive an email with your download link once your bundle is ready.',
}

export default function OrderSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
