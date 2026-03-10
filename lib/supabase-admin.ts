import { createClient } from '@supabase/supabase-js';

// Validate required environment variables at build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Create admin client with service role key
// This client bypasses RLS and should NEVER be exposed to the browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        // Don't persist auth state - this is for server-side only
        persistSession: false,
        autoRefreshToken: false,
    },
    // Edge runtime optimization
    db: {
        schema: 'public',
    },
});
