-- 1. Create Storage Buckets if they don't exist
-- Note: 'portfolio' is used for categories, 'products' for product images

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS for Storage (Allow public read, authenticated write)
CREATE POLICY "Allow public read-only access to portfolio" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'portfolio');

CREATE POLICY "Allow authenticated users to upload to portfolio" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio');

CREATE POLICY "Allow public read-only access to products" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'products');

CREATE POLICY "Allow authenticated users to upload to products" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');

-- 3. Update 'products' table schema
-- Add 'is_sale' and convert 'category' to 'categories' array

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_sale BOOLEAN DEFAULT false;

-- Move data from 'category' (text) to 'categories' (text array) if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category') THEN
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
        UPDATE public.products SET categories = ARRAY[category] WHERE category IS NOT NULL AND categories = '{}';
        -- Optional: Drop old column later if sure. For now, keep it for safety.
        -- ALTER TABLE public.products DROP COLUMN category;
    END IF;
END $$;
