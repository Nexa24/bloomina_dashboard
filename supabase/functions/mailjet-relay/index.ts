// Supabase Edge Function: mailjet-relay
// Simple version for debugging.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MAILJET_API_KEY = Deno.env.get('MAILJET_API_KEY')
    const MAILJET_SECRET_KEY = Deno.env.get('MAILJET_SECRET_KEY')

    if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) {
      throw new Error("Secrets not found in Edge Function environment.");
    }

    const body = await req.json().catch(() => ({}));
    const { to, name, subject, html } = body;

    if (!to || !html) {
      throw new Error("Missing recipient or HTML content.");
    }

    const auth = btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`)
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: "no-reply@Bloomina.in",
              Name: "Bloomina"
            },
            To: [
              {
                Email: to,
                Name: name || "Customer"
              }
            ],
            Subject: subject || "Notification",
            HTMLPart: html
          }
        ]
      })
    })

    const result = await response.json().catch(() => ({}));
    
    return new Response(JSON.stringify({ 
      success: response.ok, 
      data: result,
      error: response.ok ? null : (result.ErrorMessage || "Mailjet API failed")
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

