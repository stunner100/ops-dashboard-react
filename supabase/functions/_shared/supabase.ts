import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Create Supabase client for Edge Functions
export function createSupabaseClient(authHeader?: string) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    return createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: authHeader ? { Authorization: authHeader } : {},
        },
    });
}

// Create admin client (bypasses RLS)
export function createSupabaseAdmin() {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
