import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase Admin client with service role access.
 * This client bypasses RLS and should NEVER be used in the browser.
 */
export function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Backend Error: Missing Supabase Admin credentials (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
    }
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        db: {
            schema: 'public',
        },
    });
}

// Re-export a singleton for simple imports
import { supabaseAdmin } from '@/lib/supabase/client'
export { supabaseAdmin }
