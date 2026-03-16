import { createBrowserClient as createBrowserSupabaseClient } from '@supabase/ssr'

/**
 * Standard Browser Client
 * Re-exports the createBrowserClient from @supabase/ssr as the specific 
 * function the frontend components expect.
 */
export function createBrowserClient() {
  return createBrowserSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Legacy support for createClient() calling createBrowserClient()
 */
export const createClient = createBrowserClient

/**
 * Admin client for backend/edge use (Service Role)
 * Bypasses RLS. NEVER expose to the browser.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
