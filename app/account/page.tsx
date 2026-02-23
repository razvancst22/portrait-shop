import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createAuthClient } from '@/lib/supabase/auth-server'
import { AccountDashboard } from '@/components/account/account-dashboard'
import { PageContainer } from '@/components/layout/page-container'

export const metadata: Metadata = {
  title: 'My Account – Manage Your Classic Art Portrait Orders',
  description: 'View your portrait generations, manage your plan, access downloads, and track order history. Everything you need in one place.',
}

export default async function AccountPage() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <PageContainer maxWidth="lg" padding="lg" className="flex flex-col items-center">
      <AccountDashboard />
    </PageContainer>
  )
}
