-- EMERGENCY FIX: Syncing and Linking
-- Run this Entire Block to fix the "referral_count" error and link Admin + User Site.

-- 1. Stop existing triggers to prevent errors during fix
DROP TRIGGER IF EXISTS on_profile_update_sync ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_insert_sync ON public.profiles;

-- 2. Add ALL missing columns for referral and coin tracking
DO $$ 
BEGIN 
    -- referral_count
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referral_count') THEN 
        ALTER TABLE public.profiles ADD COLUMN referral_count INTEGER DEFAULT 0;
    END IF;

    -- referred_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referred_by') THEN 
        ALTER TABLE public.profiles ADD COLUMN referred_by TEXT;
    END IF;

    -- coin_history
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='coin_history') THEN 
        ALTER TABLE public.profiles ADD COLUMN coin_history JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. Re-install the Synchronization Logic
-- This ensures Admin Panels edits are visible to Users immediately
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'coins', NEW.coins,
            'referral_count', NEW.referral_count,
            'status', NEW.status,
            'full_name', NEW.full_name,
            'phone', NEW.phone,
            'referral_code', NEW.referral_code
        )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach the triggers
CREATE TRIGGER on_profile_update_sync
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_auth_metadata();

CREATE TRIGGER on_profile_insert_sync
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_auth_metadata();

-- 5. Final sync: Push current data to Auth metadata so everything matches NOW
UPDATE public.profiles p
SET updated_at = now()
WHERE id IN (SELECT id FROM auth.users);
