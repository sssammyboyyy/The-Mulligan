import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Browser/Anon Client — Uses the public anon key.
 * Safe for client-side and server-side reads within RLS policies.
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Admin Client — Uses the Service Role key.
 * Bypasses RLS. NEVER expose to the browser.
 * Used for: Ghost Cleanup, Availability reads, Reconciliation.
 */
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
