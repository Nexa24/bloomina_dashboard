-- Allow only admins to delete reviews
DROP POLICY IF EXISTS "Allow public delete access to reviews" ON public.reviews;
CREATE POLICY "Allow admin delete access to reviews"
    ON public.reviews FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
