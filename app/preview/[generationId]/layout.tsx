import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Your preview – petportrait.shop',
  description: 'Your pet portrait preview is ready. Purchase your full digital bundle to get high-res and wallpaper formats.',
}

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
