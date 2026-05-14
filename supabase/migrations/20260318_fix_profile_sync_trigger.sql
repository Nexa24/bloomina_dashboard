-- Repair profile sync for databases where referral columns were never added.
-- This migration is safe to run multiple times.

DROP TRIGGER IF EXISTS on_profile_update_sync ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_insert_sync ON public.profiles;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'referral_count'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN referral_count INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'referred_by'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN referred_by TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'coin_history'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN coin_history JSONB NOT NULL DEFAULT '[]'::jsonb;
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_to_auth_metadata()
RETURNS TRIGGER AS $$
DECLARE
    profile_json JSONB := to_jsonb(NEW);
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data =
        COALESCE(raw_user_meta_data, '{}'::jsonb) ||
        jsonb_strip_nulls(
            jsonb_build_object(
                'coins', COALESCE((profile_json ->> 'coins')::INTEGER, 0),
                'referral_count', COALESCE((profile_json ->> 'referral_count')::INTEGER, 0),
                'status', COALESCE(profile_json ->> 'status', 'active'),
                'full_name', profile_json ->> 'full_name',
                'phone', profile_json ->> 'phone',
                'referral_code', profile_json ->> 'referral_code'
            )
        )
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_update_sync
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_auth_metadata();

CREATE TRIGGER on_profile_insert_sync
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_auth_metadata();
