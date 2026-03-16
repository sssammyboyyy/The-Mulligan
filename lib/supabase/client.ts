import { createBrowserClient as createSSRClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Standard Browser Client
 * Re-exports the createBrowserClient from @supabase/ssr as the specific 
 * function the frontend components expect.
 */
export function createBrowserClient() {
  return createSSRClient(
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
 * Lazy initialization prevents Edge Worker 1101 boot crashes.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.warn("⚠️ Supabase Admin credentials missing at runtime.");
  }

  return createSupabaseClient(url!, key!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
