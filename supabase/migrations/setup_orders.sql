-- Run this block in the Supabase SQL Editor to create the main 'orders' table

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    email TEXT,
    total NUMERIC,
    status TEXT DEFAULT 'Processing',
    items JSONB DEFAULT '[]'::jsonb,
    delivery_method TEXT,
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Safely add new columns if the table already exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_method') THEN 
        ALTER TABLE public.orders ADD COLUMN delivery_method TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_number') THEN 
        ALTER TABLE public.orders ADD COLUMN tracking_number TEXT;
    END IF;
END $$;

-- Security Policies (Ensure proper permissions)
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable select for tracking" ON public.orders;
DROP POLICY IF EXISTS "Enable update for all" ON public.orders;
DROP POLICY IF EXISTS "Enable delete for all" ON public.orders;

-- 1. Admins have full access to manage all orders
CREATE POLICY "Admins have full access on orders" ON public.orders
    FOR ALL
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- 2. Logged-in users can view their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);
