import { createBrowserClient as createSSRClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Standardized Browser Client for App Router
 * Lazily initialized to prevent Edge worker crashes on missing vars
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn("⚠️ CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error("Supabase environment variables are missing. Check Cloudflare Pages settings.");
  }

  return createSSRClient(url, key);
}

/**
 * Legacy support for createClient() calling createBrowserClient()
 */
export const createClient = createBrowserClient

/**
 * Admin Singleton (Service Role) - Restricted to Server Side
 * Lazily initialized to gracefully degrade and return 500s instead of 1101s
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("⚠️ CRITICAL: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    throw new Error("Supabase Admin environment variables are missing. Check Cloudflare Pages settings.");
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
