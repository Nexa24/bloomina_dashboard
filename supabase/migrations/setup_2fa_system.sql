-- Two-Step Verification System Setup

-- 1. Add 2FA flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT true;

-- 2. Create table for temporary verification codes
CREATE TABLE IF NOT EXISTS public.admin_auth_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Security: Only allow deletion/expiration by system or cleanup
ALTER TABLE public.admin_auth_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own auth codes" ON public.admin_auth_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auth codes" ON public.admin_auth_codes
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Function to generate and send (simulate) OTP
CREATE OR REPLACE FUNCTION generate_admin_otp(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_last_sent TIMESTAMPTZ;
BEGIN
    -- Check for rate limiting (60 seconds)
    SELECT created_at INTO v_last_sent FROM public.admin_auth_codes 
    WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1;
    
    IF v_last_sent IS NOT NULL AND (now() - v_last_sent) < interval '1 minute' THEN
        RAISE EXCEPTION 'Please wait 60 seconds before requesting a new code.';
    END IF;

    -- Generate 6-digit random code
    v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Delete any existing codes for this user
    DELETE FROM public.admin_auth_codes WHERE user_id = p_user_id;
    
    -- Insert new code
    INSERT INTO public.admin_auth_codes (user_id, code, expires_at)
    VALUES (p_user_id, v_code, now() + interval '5 minutes');
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Session Tracking Infrastructure (Fixes 404 Error)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT,
    user_agent TEXT,
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert their own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update their own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);

-- 5. Function to verify OTP
CREATE OR REPLACE FUNCTION verify_admin_otp(p_user_id UUID, p_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.admin_auth_codes 
        WHERE user_id = p_user_id 
        AND code = p_code 
        AND expires_at > now()
    ) THEN
        DELETE FROM public.admin_auth_codes WHERE user_id = p_user_id;
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
