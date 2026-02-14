import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Supabase client for Client Components (auth, session).
 * Session is stored in cookies; middleware refreshes it.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
