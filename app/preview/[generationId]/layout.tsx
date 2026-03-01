import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Portrait Preview",
  description:
    "Your portrait preview is ready. Purchase full digital bundle.",
}

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
