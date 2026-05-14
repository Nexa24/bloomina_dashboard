-- Add missing columns to the profiles table for referrals and coin history
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referral_count') THEN 
        ALTER TABLE public.profiles ADD COLUMN referral_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referred_by') THEN 
        ALTER TABLE public.profiles ADD COLUMN referred_by TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='coin_history') THEN 
        ALTER TABLE public.profiles ADD COLUMN coin_history JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
