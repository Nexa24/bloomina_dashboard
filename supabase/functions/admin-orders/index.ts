// Supabase Edge Function: admin-orders
// Enforces server-side admin authorization before returning all orders or allowing status updates.
// This is the REAL security boundary for admin operations, making the frontend check redundant.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Check for Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 2. Create a Supabase client using the caller's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // 3. Get the authenticated user from their JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token', details: userError?.message }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // 3. SERVER-SIDE admin check: query the database directly using the service role key
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || user.email === 'Bloomina.in@gmail.com'

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const body = await req.json().catch(() => ({}));
    const { action, orderId, status } = body;

    // 4. GET all orders (admin only — verified above)
    if (req.method === 'GET' || action === 'getAll') {
      const { data: orders, error: fetchError } = await adminClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), { 
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      return new Response(JSON.stringify({ data: orders }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    // 5. UPDATE order status (admin only — verified above)
    if (action === 'updateStatus' && orderId && status) {
      const { error: updateError } = await adminClient
        .from('orders')
        .update({ status })
        .eq('id', orderId)

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { 
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action or missing parameters' }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  }
})

