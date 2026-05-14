-- Create the reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    product_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    verified BOOLEAN DEFAULT false
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to read reviews
CREATE POLICY "Allow public read access to reviews"
    ON public.reviews FOR SELECT
    USING (true);

-- Allow anonymous and authenticated users to insert reviews
CREATE POLICY "Allow public insert access to reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (true);
