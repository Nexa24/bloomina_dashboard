-- 1. Create a secure vault for the Edge Function URL if needed, 
-- but for now we'll use a direct trigger to the local/hosted function.

-- 2. Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.trg_send_admin_otp()
RETURNS TRIGGER AS $$
BEGIN
  -- We use the supabase internal net extension to call the Edge Function
  -- This requires the 'pg_net' extension to be enabled in Supabase
  PERFORM
    net.http_post(
      url := (SELECT value FROM (SELECT COALESCE(
        (SELECT value FROM settings WHERE key = 'edge_function_url'), 
        'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/send-otp'
      )) AS t(value)),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM settings WHERE key = 'service_role_key')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on the admin_auth_codes table
DROP TRIGGER IF EXISTS on_admin_otp_generated ON public.admin_auth_codes;
CREATE TRIGGER on_admin_otp_generated
  AFTER INSERT ON public.admin_auth_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_send_admin_otp();

-- 4. Note: Alternatively, you can set this up via the Supabase Dashboard 
-- under "Database" -> "Webhooks" which is the modern and recommended way.
