import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3'

// Load environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const RESEND_API_KEY = Deno.env.get('VITE_RESEND_API_KEY') || Deno.env.get('RESEND_API_KEY')

const resend = new Resend(RESEND_API_KEY)

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY ?? '')

function getFirstName(user: any) {
  const meta = user.raw_user_meta_data || {}
  if (meta.first_name) return meta.first_name
  if (meta.full_name) return meta.full_name.split(' ')[0]
  if (meta.name) return meta.name.split(' ')[0]
  return 'there'
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Received login event payload:", JSON.stringify(payload, null, 2))

    const user = payload.record || payload
    const email = user.email

    if (!email) {
      console.error("No email found in payload")
      return new Response(JSON.stringify({ error: "No email provided" }), { status: 400 })
    }

    // Verify last_sign_in_at change
    if (payload.old_record && payload.record) {
      if (payload.old_record.last_sign_in_at === payload.record.last_sign_in_at) {
        console.log("last_sign_in_at didn't change, skipping")
        return new Response(JSON.stringify({ success: true, message: "No login detected" }))
      }
    }

    // Fetch coins/referral with retry logic
    let profile = null
    for (let i = 0; i < 3; i++) {
        const { data } = await supabase
            .from('profiles')
            .select('coins, referral_code')
            .eq('id', user.id)
            .single()
        
        if (data) {
            profile = data
            break
        }
        console.log(`Profile not found for user ${user.id}, retrying... (${i+1}/3)`)
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const coins = profile?.coins || 0
    const referralCode = profile?.referral_code || 'Bloomina'
    const firstName = getFirstName(user)

    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Bloomina</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8f7ff; margin: 0; padding: 0; color: #111827; }
        .wrapper { padding: 40px 20px; width: 100%; box-sizing: border-box; }
        .container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05); }
        .header { text-align: center; padding: 40px 20px 20px; }
        .logo { font-size: 24px; font-weight: 800; color: #111827; text-decoration: none; display: inline-block; }
        .illustration-container { text-align: center; padding: 0 40px; }
        .content { padding: 0 40px 30px; }
        h1 { font-size: 24px; font-weight: 800; margin-top: 0; margin-bottom: 20px; color: #111827; text-align: center; }
        p { font-size: 15px; line-height: 1.62; margin-bottom: 18px; color: #4b5563; text-align: left; }
        .highlight { color: #8c74fb; font-weight: 600; }
        .story-section { font-style: italic; border-left: 3px solid #edebff; padding-left: 20px; margin: 25px 0; }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #8c74fb 0%, #6366f1 100%); 
            color: white !important; 
            padding: 16px 32px; 
            border-radius: 14px; 
            text-decoration: none; 
            font-weight: 700; 
            font-size: 16px; 
            box-shadow: 0 10px 20px rgba(140, 116, 251, 0.3);
            margin: 10px 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8f7ff">
        <tr><td align="center" class="wrapper"><div class="container">
            <div class="header"><a href="https://Bloomina.in" class="logo"><img src="https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771920901826_Bloomina_transparent_blue.png" alt="Bloomina Logo" style="height: 50px; width: auto; max-width: 100%; display: block; margin: 0 auto;"></a></div>
            
            <div class="illustration-container" style="text-align: center; padding: 20px 40px;"><img src="https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921621583_mega-creator%20(2).png" style="max-width: 100%; height: auto; border-radius: 12px;"></div>

            <div class="content">
                <h1>Welcome to the Family, ${firstName}</h1>
                
                <p>Bloomina didn't start in a boardroom. It started with a <span class="highlight">simple realization</span>: that the clothes we wear should be as unique and authentic as the people who wear them.</p>
                
                <div class="story-section">
                    "We noticed how difficult it was to find pieces that didn't just fit the body, but fit the soul. We wanted to create a space where every delivery feels like a gift to yourself."
                </div>

                <p>Today, you're not just a customer—you're part of a community of fashion enthusiasts who believe that <span class="highlight">style is a form of self-love</span>. We're here to be your companion in this journey.</p>

                <div style="background-color: #f8f7ff; border: 2px solid #edebff; border-radius: 20px; padding: 25px; margin: 30px 0; text-align: center;">
                    <img src="https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1774422887990_a9aa0cc2265c324126fdf1f273468ec4-removebg-preview.png" style="width: 70px; height: auto; margin-bottom: 15px;">
                    <div style="font-size: 28px; font-weight: 800; color: #8c74fb;">${coins} Coins</div>
                    <p style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; text-align: center;">Your Shopping Credits</p>
                    
                    <div style="margin-top: 25px;">
                        <a href="https://Bloomina.in/account" class="cta-button">Go to My Account</a>
                    </div>
                </div>

                <p>Share your code <span class="highlight">${referralCode}</span> with friends and earn rewards as they join our story.</p>
            </div>

            <div style="background-color: #fcfbff; border-top: 1px solid #f3f0ff; padding: 40px; font-size: 14px; color: #6b7280;">
                <p style="margin-top: 0; text-align: left;">Need anything? Email us at <a href="mailto:support@Bloomina.in" style="color: #8c74fb; text-decoration: none; font-weight: 600;">support@Bloomina.in</a></p>
                <div style="margin-top: 25px;">
                    <p style="margin: 0; line-height: 1.6; text-align: left;">Stay True,<br><b>The Bloomina Team</b></p>
                </div>
            </div>
        </div></td></tr>
    </table>
</body>
</html>`

    const { data, error } = await resend.emails.send({
      from: 'Bloomina <no-reply@Bloomina.in>',
      to: [email],
      subject: 'A New Chapter with Bloomina 📖',
      html: htmlTemplate,
    })

    if (error) {
      console.error("Resend Error:", JSON.stringify(error, null, 2))
      return new Response(JSON.stringify({ error }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("System Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

