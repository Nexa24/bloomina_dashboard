-- Add user_id column to associate reviews with the customer who added them
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop previous insecure or loose policies
DROP POLICY IF EXISTS "Allow public delete access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert access to reviews" ON public.reviews;

-- Insert policy: allow inserting if user is anon (user_id is null) or if the user is authenticated and claiming their own ID
CREATE POLICY "Allow public insert access to reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

-- Delete policy: restrict deletion so ONLY the authenticated user who owns the review can delete it
CREATE POLICY "Allow users to delete their own reviews"
    ON public.reviews FOR DELETE
    USING (auth.uid() = user_id AND auth.uid() IS NOT NULL);
