import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your custom portrait purchase. Secure checkout.",
}

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
