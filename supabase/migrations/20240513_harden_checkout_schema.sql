-- Harden Checkout Schema: Add missing columns to orders and profiles
-- This ensures the checkout flow and address saving work correctly.

-- 1. Update Orders Table
DO $$ 
BEGIN 
    -- Ensure ID has a default generator if it's currently TEXT
    IF (SELECT data_type FROM information_schema.columns WHERE table_name='orders' AND column_name='id') = 'text' THEN
        ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    END IF;

    -- Basic price/discount columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='subtotal') THEN 
        ALTER TABLE public.orders ADD COLUMN subtotal NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='discount_amount') THEN 
        ALTER TABLE public.orders ADD COLUMN discount_amount NUMERIC DEFAULT 0;
    END IF;

    -- Coupon linking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='applied_coupon_id') THEN 
        ALTER TABLE public.orders ADD COLUMN applied_coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;
    END IF;

    -- Shipping and Payment details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_address') THEN 
        ALTER TABLE public.orders ADD COLUMN shipping_address JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='payment_method') THEN 
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_order_id') THEN 
        ALTER TABLE public.orders ADD COLUMN razorpay_order_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_payment_id') THEN 
        ALTER TABLE public.orders ADD COLUMN razorpay_payment_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='razorpay_signature') THEN 
        ALTER TABLE public.orders ADD COLUMN razorpay_signature TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='phone') THEN 
        ALTER TABLE public.orders ADD COLUMN phone TEXT;
    END IF;
END $$;

-- 2. Update Profiles Table with Address Fields
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN 
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='city') THEN 
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='state') THEN 
        ALTER TABLE public.profiles ADD COLUMN state TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='postal_code') THEN 
        ALTER TABLE public.profiles ADD COLUMN postal_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN 
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- 3. Ensure Coupon Usage Tracking exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='uses') THEN 
        ALTER TABLE public.coupons ADD COLUMN uses INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='max_uses') THEN 
        ALTER TABLE public.coupons ADD COLUMN max_uses INTEGER;
    END IF;
END $$;

-- 4. Create function to increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.coupons
    SET uses = uses + 1
    WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Security Policies for Profiles
-- Ensure users can manage their own data
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
