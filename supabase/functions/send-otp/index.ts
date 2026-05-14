import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Support both: direct call { user_id } OR webhook payload { record: { user_id, code } }
    const user_id = body.user_id ?? body.record?.user_id
    const codeFromWebhook = body.record?.code ?? null

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // If no code from webhook, look up the latest valid one from DB
    let code = codeFromWebhook
    if (!code) {
      const { data: otpRecord, error: otpError } = await supabase
        .from('admin_auth_codes')
        .select('code')
        .eq('user_id', user_id)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (otpError || !otpRecord?.code) {
        console.error('OTP lookup failed:', otpError)
        return new Response(JSON.stringify({ error: "No valid OTP found" }), { 
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }
      code = otpRecord.code
    }

    // Fetch admin email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .single()

    if (profileError || !profile?.email) {
      console.error('Profile fetch failed:', profileError)
      return new Response(JSON.stringify({ error: "Admin profile not found" }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    console.log(`Sending OTP to: ${profile.email}`)

    // Send email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Bloomina Security <security@bloomina.in>',
        to: [profile.email],
        subject: `${code} — Your Bloomina Admin login code`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
            <h1 style="color: #944555; font-size: 22px; font-weight: 800; margin-bottom: 8px;">Bloomina Admin</h1>
            <p style="color: #666; font-size: 15px; margin-bottom: 32px;">
              Hi ${profile.full_name || 'Admin'},<br>Your secure login code is:
            </p>
            <div style="background: #f8f9fa; padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 32px;">
              <span style="font-size: 42px; font-weight: 900; letter-spacing: 14px; color: #944555;">${code}</span>
            </div>
            <p style="color: #999; font-size: 13px; line-height: 1.6;">
              This code expires in 10 minutes. Do not share it with anyone.
            </p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #ccc; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
              &copy; 2024 Bloomina. All rights reserved.
            </div>
          </div>
        `,
      }),
    })

    const resendData = await resendRes.json()
    console.log('Resend response:', resendRes.status, JSON.stringify(resendData))

    return new Response(JSON.stringify(resendData), { 
      status: resendRes.status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('send-otp error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
