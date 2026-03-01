import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Create Custom Portrait – Dog, Cat, Family",
  description:
    "Create your custom portrait. Choose style, upload photo. Free preview before purchase.",
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
