import { createClient } from '@supabase/supabase-js';

// Internal helper to get keys safely
const getKeys = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Backend Error: Missing Supabase Admin credentials');
    }
    return { url, key };
};

/**
 * Creates a Supabase Admin client with service role access.
 * This client bypasses RLS and should NEVER be used in the browser.
 */
export const getSupabaseAdmin = () => {
    const { url, key } = getKeys();
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        db: {
            schema: 'public',
        },
    });
};
