import { redirect } from 'next/navigation'
import { createAuthClient } from '@/lib/supabase/auth-server'

/**
 * My Masterpieces is deprecated. Redirect to:
 * - /account if user is logged in
 * - /my-portraits if guest
 */
export default async function MyMasterpiecesPage() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/account')
  }

  redirect('/my-portraits')
}
