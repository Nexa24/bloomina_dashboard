-- Create size_guides table
CREATE TABLE IF NOT EXISTS public.size_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT, -- Link to a technical drawing/illustration
    chart_data JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { "size": "S", "bust": "32-34", ... }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add size_guide_id to products table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='size_guide_id') THEN
        ALTER TABLE public.products ADD COLUMN size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL;
    ELSE
        ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_size_guide_id_fkey;
        ALTER TABLE public.products ADD CONSTRAINT products_size_guide_id_fkey FOREIGN KEY (size_guide_id) REFERENCES public.size_guides(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;

-- Add full operations access policy
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='size_guides' AND policyname='Enable all operations for all users') THEN
        CREATE POLICY "Enable all operations for all users" ON public.size_guides FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Seed with initial Size Guides
INSERT INTO public.size_guides (name, description, image_url, chart_data)
VALUES 
(
    'Standard Bra Size Guide', 
    'Our bras are designed for a snug yet comfortable fit. Measure your underbust and overbust to find your perfect match.',
    'https://placehold.co/600x400?text=How+to+Measure+Bra+Size',
    '[
        {"size": "32B", "underbust": "27-28\"", "overbust": "32-33\""},
        {"size": "34B", "underbust": "29-30\"", "overbust": "34-35\""},
        {"size": "36B", "underbust": "31-32\"", "overbust": "36-37\""},
        {"size": "38B", "underbust": "33-34\"", "overbust": "38-39\""},
        {"size": "40B", "underbust": "35-36\"", "overbust": "40-41\""}
    ]'::jsonb
),
(
    'Standard Panty Size Guide', 
    'Measure around the fullest part of your hips to ensure a perfect fit that stays in place all day.',
    'https://placehold.co/600x400?text=How+to+Measure+Panty+Size',
    '[
        {"size": "S", "waist": "26-27\"", "hips": "36-37\""},
        {"size": "M", "waist": "28-29\"", "hips": "38-39\""},
        {"size": "L", "waist": "30-31\"", "hips": "40-41\""},
        {"size": "XL", "waist": "32-33\"", "hips": "42-43\""},
        {"size": "XXL", "waist": "34-35\"", "hips": "44-45\""}
    ]'::jsonb
);
