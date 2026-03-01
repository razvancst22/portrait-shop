import { SupportChat } from '@/components/support/support-chat'
import { SITE_NAME } from '@/lib/site-config'

export const metadata = {
  title: `Get Support – ${SITE_NAME}`,
  description: `Chat with our AI support assistant for help with orders, downloads, refunds, and more.`,
}

export default function SupportPage() {
  return <SupportChat />
}
