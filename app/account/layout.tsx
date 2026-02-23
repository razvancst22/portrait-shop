import { redirect } from 'next/navigation'
import { createAuthClient } from '@/lib/supabase/auth-server'

/**
 * Account layout: requires authentication for all /account/* routes.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
