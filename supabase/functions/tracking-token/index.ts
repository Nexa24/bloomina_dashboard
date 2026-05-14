// Supabase Edge Function: tracking-token
// Generates and manages one-time/signed tokens for order tracking to protect user privacy (no email in URL)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}));
    const { action, orderId, email, token } = body;

    const JWT_SECRET = Deno.env.get('JWT_SECRET');

    if (action === 'generate') {
      if (!orderId || !email || !JWT_SECRET) {
        throw new Error("Missing parameters for token generation.");
      }
      const saltedToken = btoa(`${orderId}-${email}-${JWT_SECRET}`).substring(0, 16);
      
      return new Response(JSON.stringify({ success: true, token: saltedToken }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    if (action === 'verify') {
      if (!orderId || !token || !JWT_SECRET) {
        throw new Error("Missing parameters for token verification.");
      }
      
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      const { data: dbOrder } = await supabase.from('orders').select('email').eq('id', orderId).single();
      if (!dbOrder || !dbOrder.email) {
        throw new Error("Order not found or has no email.");
      }
      const dbEmail = dbOrder.email;

      const expectedToken = btoa(`${orderId}-${dbEmail}-${JWT_SECRET}`).substring(0, 16);
      const isValid = token === expectedToken;

      return new Response(JSON.stringify({ success: isValid, email: isValid ? dbEmail : null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid Action or missing parameters" }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  }
})
