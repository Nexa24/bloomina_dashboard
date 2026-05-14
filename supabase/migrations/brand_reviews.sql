CREATE TABLE IF NOT EXISTS public.brand_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT NOT NULL,
    suggestions TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'featured', 'archived')),
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.brand_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public to insert reviews unconditionally (since anyone can leave feedback)
CREATE POLICY "Allow public insert on brand_reviews" ON public.brand_reviews
    FOR INSERT WITH CHECK (true);

-- Allow admins to read all reviews
CREATE POLICY "Allow admin read on brand_reviews" ON public.brand_reviews
    FOR SELECT USING (true);

-- Allow admins to update reviews
CREATE POLICY "Allow admin update on brand_reviews" ON public.brand_reviews
    FOR UPDATE USING (true) WITH CHECK (true);

-- Allow admins to delete reviews
CREATE POLICY "Allow admin delete on brand_reviews" ON public.brand_reviews
    FOR DELETE USING (true);
