-- ==========================================
-- SUPABASE MFA TEARDOWN
-- ==========================================

-- 1. Optional: Un-enroll all users from all MFA Factors
-- If you want to force-delete all setup factors from your database so auth starts totally fresh:
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_amr_claims;

-- 2. Turn off MFA in your Supabase Dashboard Settings
-- You must manually go to: 
-- 1. Authentication > Multi-Factor Authentication
-- 2. Toggle "Enable Multi-Factor Authentication" to OFF.

-- Note: The role='admin' metadata remains on your account so you can still securely login!
