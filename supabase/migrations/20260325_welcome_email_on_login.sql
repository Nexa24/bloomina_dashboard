
-- 1. Enable Http extension for reliable server-side notifications
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_welcome_email_on_login()
RETURNS TRIGGER AS $$
DECLARE
  -- Replace with your Edge Function URL
  edge_function_url text := 'https://brhjzpzdlkbqhtaqoyjw.supabase.co/functions/v1/welcome-email';
  payload jsonb;
BEGIN
  -- Only trigger if this is the VERY FIRST login (last_sign_in_at moves from NULL to NOT NULL)
  -- This prevents the email from sending on subsequent visits
  IF (OLD.last_sign_in_at IS NULL AND NEW.last_sign_in_at IS NOT NULL) THEN
    
    payload := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'last_sign_in_at', NEW.last_sign_in_at,
        'raw_user_meta_data', NEW.raw_user_meta_data
      ),
      'old_record', jsonb_build_object(
        'last_sign_in_at', OLD.last_sign_in_at
      )
    );

    -- Perform the HTTP POST call to our Edge Function
    -- Note: We include the ANON key to authorize if needed, though for internal use it might differ
    PERFORM extensions.http_post(
      edge_function_url,
      payload::text,
      'application/json'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Set up the Trigger on auth.users
-- This has to be done on the auth schema if we want to catch all logins
-- If forbidden, we might need to trigger on a related public profile table update
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_welcome_email_on_login();
