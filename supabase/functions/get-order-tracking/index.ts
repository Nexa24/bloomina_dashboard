// Supabase Edge Function: get-order-tracking
// Returns LIMITED order tracking data only after server-side ownership verification.
// Prevents leaking sensitive order details (prices, address) to unauthorized viewers.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderId, email } = await req.json()

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // 1. Create a privileged client to search for the order across the whole DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2. Fetch the order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, user_id, email, status, created_at, delivery_method, tracking_number')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // 3. SERVER-SIDE AUTHORIZATION
    // Only allow access if:
    // a) The provided email matches the order email
    // b) OR a JWT is provided and user_id matches (checked below if email doesn't match)
    
    let isAuthorized = false;

    // Check email match (if email provided)
    if (email && order.email && email.toLowerCase() === order.email.toLowerCase()) {
      isAuthorized = true;
    }

    // Check JWT match (if token provided)
    const authHeader = req.headers.get('Authorization')
    if (!isAuthorized && authHeader) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user } } = await userClient.auth.getUser()
      if (user && user.id === order.user_id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Access denied to this order' }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    // 4. Return LIMITED data (No totals, no full address, no payment details)
    return new Response(JSON.stringify({ data: order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
