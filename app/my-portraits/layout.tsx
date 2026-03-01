import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "My Portraits – View & Download",
  description: "View and download your custom portraits. High-res artwork.",
}

export default function MyPortraitsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
