-- COMPREHENSIVE STORAGE FIX
-- This script ensures buckets exist and anyone can upload photos for Admin purposes.

-- 1. Create/Ensure buckets are public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio', 'portfolio', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing restrictive policies (optional but safer for clean slate)
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public All" ON storage.objects;
DROP POLICY IF EXISTS "Public All Portfolio" ON storage.objects;

-- 3. Create permissive policies for 'products' bucket
CREATE POLICY "Public All Products" ON storage.objects 
FOR ALL USING (bucket_id = 'products') 
WITH CHECK (bucket_id = 'products');

-- 4. Create permissive policies for 'portfolio' bucket (categories)
CREATE POLICY "Public All Portfolio" ON storage.objects 
FOR ALL USING (bucket_id = 'portfolio') 
WITH CHECK (bucket_id = 'portfolio');

-- Note: 'FOR ALL' covers SELECT, INSERT, UPDATE, and DELETE for all users (anon and authenticated).
