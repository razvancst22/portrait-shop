import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Portraits – Access Your Classic Art Creations',
  description: 'View and download your AI-generated Renaissance, Baroque, and Victorian portraits. Access your high-resolution artwork anytime.',
}

export default function MyPortraitsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
