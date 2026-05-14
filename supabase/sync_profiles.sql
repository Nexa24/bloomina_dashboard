-- 1. Sync existing users into the profiles table
INSERT INTO public.profiles (id, email, full_name, role, status, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', 'Anonymous User'),
    'customer',
    'active',
    created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

-- 2. Create a function to handle new user signups automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Anonymous User'),
    'customer',
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
