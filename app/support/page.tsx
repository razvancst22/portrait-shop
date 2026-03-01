import { redirect } from 'next/navigation'
import { SupportChat } from '@/components/support/support-chat'
import { SITE_NAME } from '@/lib/site-config'
import { createAuthClient } from '@/lib/supabase/auth-server'

export const metadata = {
  title: `Get Support – ${SITE_NAME}`,
  description: `Chat with our AI support assistant for help with orders, downloads, refunds, and more.`,
}

export default async function SupportPage() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/support')
  }

  return <SupportChat />
}
