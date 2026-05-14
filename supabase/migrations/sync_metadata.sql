-- Synchronization Trigger: Keep 'profiles' and 'auth.users' metadata in sync
-- This ensures that changes made in the Admin Panel (profiles table) 
-- are instantly visible on the User Website (auth metadata).

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

-- Attach trigger to profiles table
DROP TRIGGER IF EXISTS on_profile_update_sync ON public.profiles;
CREATE TRIGGER on_profile_update_sync
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_auth_metadata();

-- Also handle initial creation sync
DROP TRIGGER IF EXISTS on_profile_insert_sync ON public.profiles;
CREATE TRIGGER on_profile_insert_sync
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_auth_metadata();
