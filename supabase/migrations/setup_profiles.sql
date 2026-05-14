-- Run this in the Supabase SQL Editor to enable the Customer Management system
-- This creates a public.profiles table that automatically syncs with your Auth users

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  location TEXT,
  status TEXT DEFAULT 'active', -- active | blocked
  coins INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referral_count INTEGER DEFAULT 0,
  referred_by TEXT,
  coin_history JSONB DEFAULT '[]'::jsonb,
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure the role column is safely retrofitted onto existing databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for Admins to view and manage everyone
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Functions to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, referral_code, referred_by)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    UPPER(SUBSTR(MD5(RANDOM()::TEXT), 0, 8)), -- Generate a unique referral code
    NEW.raw_user_meta_data->>'referred_by'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on every new signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Sync existing users if the table was just created
INSERT INTO public.profiles (id, full_name, email, referral_code)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
    email,
    UPPER(SUBSTR(MD5(id::TEXT), 0, 8))
FROM auth.users
ON CONFLICT (id) DO NOTHING;
