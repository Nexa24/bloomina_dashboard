// Supabase Edge Function: mailerlite-relay
// Relays e-commerce events to MailerLite securely to protect the API Key

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY')
    const MAILERLITE_SHOP_ID = Deno.env.get('MAILERLITE_SHOP_ID')

    if (!MAILERLITE_API_KEY || !MAILERLITE_SHOP_ID) {
      throw new Error("Secrets not found in Edge Function environment.");
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.payload) {
      throw new Error("Invalid request body or missing payload.");
    }

    const response = await fetch(`https://connect.mailerlite.com/api/ecommerce/shops/${MAILERLITE_SHOP_ID}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`
      },
      body: JSON.stringify(body.payload)
    });

    const result = await response.json().catch(() => ({}));
    
    return new Response(JSON.stringify({ 
      success: response.ok, 
      data: result,
      error: response.ok ? null : "MailerLite API failed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  }
})
