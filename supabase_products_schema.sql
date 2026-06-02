-- Run this script in your Supabase SQL Editor to create the products table

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'Active',
    price NUMERIC DEFAULT 0,
    "comparePrice" NUMERIC,
    cost NUMERIC DEFAULT 0,
    sku TEXT,
    barcode TEXT,
    "trackQuantity" BOOLEAN DEFAULT true,
    stock INTEGER DEFAULT 0,
    "supplierRef" TEXT,
    "hasVariants" BOOLEAN DEFAULT false,
    variants JSONB DEFAULT '[]'::jsonb,
    specifications JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.products;

CREATE POLICY "Allow public select" ON public.products 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow admin manage" ON public.products 
    FOR ALL 
    USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Optional: Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_modtime
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
