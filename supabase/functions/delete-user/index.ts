/// <reference lib="deno.ns" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'No authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create client with user's token to verify they're an admin
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

        // Create a client with the user's JWT to check if they're admin
        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        // Get the current user
        const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser()
        if (userError || !currentUser) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Check if current user is admin
        const { data: adminProfile, error: profileError } = await supabaseUser
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single()

        if (profileError || adminProfile?.role !== 'admin') {
            return new Response(
                JSON.stringify({ error: 'Admin access required' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Get the user ID to delete from the request body
        const { userId } = await req.json()
        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'User ID is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Prevent self-deletion
        if (userId === currentUser.id) {
            return new Response(
                JSON.stringify({ error: 'Cannot delete your own account' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // Delete the user from auth.users (this will cascade to profiles if set up)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            console.error('Error deleting user:', deleteError)
            return new Response(
                JSON.stringify({ error: deleteError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Also delete from profiles table (in case cascade isn't set up)
        await supabaseAdmin.from('profiles').delete().eq('id', userId)

        return new Response(
            JSON.stringify({ success: true, message: 'User deleted successfully' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
