-- ============================================================
-- OTP Email via pg_net (Server-side Resend call)
-- No Edge Function required. No CORS issues.
-- ============================================================

-- 1. Ensure pg_net extension is available (enabled by default on Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Admin settings table to store secrets securely (service_role only)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
-- No SELECT policy = only service_role / security definer functions can read

-- 3. Insert your Resend API key
--    REPLACE the value below with your actual key from resend.com/api-keys
INSERT INTO public.admin_settings (key, value)
VALUES ('resend_api_key', 'YOUR_RESEND_API_KEY_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Rewrite generate_admin_otp to send email server-side via pg_net
DROP FUNCTION IF EXISTS generate_admin_otp(uuid);
CREATE OR REPLACE FUNCTION generate_admin_otp(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_code        TEXT;
    v_last_sent   TIMESTAMPTZ;
    v_email       TEXT;
    v_full_name   TEXT;
    v_resend_key  TEXT;
    v_html        TEXT;
BEGIN
    -- Rate limiting: 30 seconds
    SELECT created_at INTO v_last_sent
    FROM public.admin_auth_codes
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_sent IS NOT NULL AND (now() - v_last_sent) < interval '30 seconds' THEN
        RAISE EXCEPTION 'Please wait 30 seconds before requesting a new code.';
    END IF;

    -- Generate 6-digit code
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

    -- Clear any previous codes for this user
    DELETE FROM public.admin_auth_codes WHERE user_id = p_user_id;

    -- Insert new code with 10-minute expiry
    INSERT INTO public.admin_auth_codes (user_id, code, expires_at)
    VALUES (p_user_id, v_code, now() + interval '10 minutes');

    -- Fetch admin email and name from profiles
    SELECT email, COALESCE(full_name, 'Admin')
    INTO v_email, v_full_name
    FROM public.profiles
    WHERE id = p_user_id;

    -- Fetch Resend API key from secure settings table
    SELECT value INTO v_resend_key
    FROM public.admin_settings
    WHERE key = 'resend_api_key';

    -- Build email HTML
    v_html := '
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px;border:1px solid #eee;border-radius:20px;">
            <h1 style="color:#944555;font-size:22px;font-weight:800;margin-bottom:8px;">Bloomina Admin</h1>
            <p style="color:#666;font-size:15px;margin-bottom:32px;">Hi ' || v_full_name || ',<br>Your secure login code is:</p>
            <div style="background:#f8f9fa;padding:24px;border-radius:16px;text-align:center;margin-bottom:32px;">
                <span style="font-size:42px;font-weight:900;letter-spacing:14px;color:#944555;">' || v_code || '</span>
            </div>
            <p style="color:#999;font-size:13px;line-height:1.6;">
                This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
            </p>
            <div style="margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#ccc;font-size:11px;text-transform:uppercase;letter-spacing:1px;">
                &copy; 2024 Bloomina. All rights reserved.
            </div>
        </div>';

    -- Send email via Resend (non-blocking, server-to-server — no CORS)
    IF v_email IS NOT NULL AND v_resend_key IS NOT NULL THEN
        PERFORM net.http_post(
            url     := 'https://api.resend.com/emails',
            headers := jsonb_build_object(
                'Content-Type',  'application/json',
                'Authorization', 'Bearer ' || v_resend_key
            ),
            body    := jsonb_build_object(
                'from',    'Bloomina Security <security@bloomina.in>',
                'to',      jsonb_build_array(v_email),
                'subject', v_code || ' — Your Bloomina Admin login code',
                'html',    v_html
            )
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
