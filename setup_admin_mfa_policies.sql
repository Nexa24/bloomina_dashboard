-- ==========================================
-- SUPER ADMIN SECURITY POLICIES & JWT RLS
-- ==========================================

-- 1. Ensure `role: "admin"` is checked in secure tables.
-- Example of enforcing Admin-only rows for a table (e.g. `orders` or `dashboard_stats`)
-- Replace `public.your_admin_table` with actual tables you wish to lock down.

-- CREATE POLICY "Enforce Admin Status for Updates" 
--    ON public.your_admin_table 
--    FOR ALL 
--    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- 2. Restricting identity bypass at the Auth level via Trigger (Optional but highly recommended)
-- This function can be hooked to auth.users ON UPDATE to prevent arbitrary users 
-- from injecting {"role": "admin"} into their own user_metadata via the client side.

CREATE OR REPLACE FUNCTION public.check_admin_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If trying to set themselves as admin without being a superuser
  IF NEW.raw_user_meta_data->>'role' = 'admin' AND OLD.raw_user_meta_data->>'role' IS DISTINCT FROM 'admin' THEN
    -- Ensure only genuine service roles can perform this action
    IF current_setting('role') != 'service_role' THEN
      RAISE EXCEPTION 'Unauthorized attempt to escalate to admin privileges.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_check_admin_role_escalation ON auth.users;
CREATE TRIGGER tr_check_admin_role_escalation
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_admin_role_escalation();

-- Note:
-- To assign an admin role to an existing user via SQL (since it's protected from the client):
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'Bloomina.in@gmail.com';

