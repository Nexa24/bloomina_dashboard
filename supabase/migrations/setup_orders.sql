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
CREATE POLICY "Enable insert for all users" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for tracking" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Enable update for all" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all" ON public.orders FOR DELETE USING (true);
