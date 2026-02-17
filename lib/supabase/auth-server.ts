import type { User } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Get current user if authenticated. Returns null when auth is not configured or no session.
 * Use in API routes to decide between user-based and guest-based logic.
 */
export async function getOptionalUser(): Promise<User | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null
  try {
    const client = await createAuthClient()
    const { data: { user } } = await client.auth.getUser()
    return user ?? null
  } catch {
    return null
  }
}

/**
 * Supabase client for auth in Server Components, Server Actions, Route Handlers.
 * Uses anon key and cookies so the current user session is available.
 * Use lib/supabase/server.ts createClient() for admin operations (service role).
 */
export async function createAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase auth not configured (missing URL or anon key)')
  }
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignore when called from Server Component (middleware will refresh)
        }
      },
    },
  })
}
