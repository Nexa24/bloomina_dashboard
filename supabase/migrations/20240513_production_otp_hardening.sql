-- Production Level Hardening for Admin 2FA

-- 1. Create a table for verified 2FA sessions (Database-backed verification)
CREATE TABLE IF NOT EXISTS public.admin_2fa_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL, -- Links to auth.sessions
    verified_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    UNIQUE(user_id, session_id)
);

ALTER TABLE public.admin_2fa_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own 2FA sessions" ON public.admin_2fa_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Modify generate_admin_otp to SECURE it (Don't return the code!)
DROP FUNCTION IF EXISTS generate_admin_otp(uuid);
CREATE OR REPLACE FUNCTION generate_admin_otp(p_user_id UUID)
RETURNS BOOLEAN AS $$
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
    VALUES (p_user_id, v_code, now() + interval '10 minutes');
    
    -- In a real production environment, a database webhook on admin_auth_codes 
    -- would trigger an Edge Function to send this code via email.
    -- For now, we return TRUE to indicate the process started.
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Modify verify_admin_otp to create a secure session entry
DROP FUNCTION IF EXISTS verify_admin_otp(uuid, text);
DROP FUNCTION IF EXISTS verify_admin_otp(uuid, text, uuid);
CREATE OR REPLACE FUNCTION verify_admin_otp(p_user_id UUID, p_code TEXT, p_session_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_valid BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.admin_auth_codes 
        WHERE user_id = p_user_id 
        AND code = p_code 
        AND expires_at > now()
    ) INTO v_valid;

    IF v_valid THEN
        -- Delete the code after use
        DELETE FROM public.admin_auth_codes WHERE user_id = p_user_id;
        
        -- If session_id is provided, create a record in admin_2fa_sessions
        IF p_session_id IS NOT NULL THEN
            INSERT INTO public.admin_2fa_sessions (user_id, session_id, expires_at)
            VALUES (p_user_id, p_session_id, now() + interval '7 days')
            ON CONFLICT (user_id, session_id) DO UPDATE 
            SET verified_at = now(), expires_at = now() + interval '7 days';
        END IF;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper function to check if a session is 2FA verified
DROP FUNCTION IF EXISTS is_admin_2fa_verified(uuid, uuid);
CREATE OR REPLACE FUNCTION is_admin_2fa_verified(p_user_id UUID, p_session_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Explicitly handle NULL session_id
    IF p_session_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.admin_2fa_sessions
        WHERE user_id = p_user_id 
        AND session_id = p_session_id
        AND expires_at > now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
