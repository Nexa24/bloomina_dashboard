-- Retrofit existing production databases with the 'role' column on profiles
-- This migration ensures that category checks (profiles.role = 'admin') won't fail
-- natively if the setup_referral_system.sql was executed without it previously.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
