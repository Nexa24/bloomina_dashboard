-- Setup Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
    discount_value NUMERIC NOT NULL,
    min_order_value NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all coupons" ON public.coupons
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Initial Sample Coupon
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_value, is_active)
VALUES ('WELCOME10', 'percentage', 10, 500, true)
ON CONFLICT (code) DO NOTHING;
