-- SQL Migration to create the 'leads' table for Contact Inquiries
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    type TEXT, -- Subject/Inquiry Type
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new', -- 'new', 'responded', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for the public contact form)
CREATE POLICY "Allow public to insert leads" 
ON public.leads FOR INSERT 
WITH CHECK (true);

-- Policy: Allow admins to select (read) all leads
-- This assumes admins have a 'role' column in their profile or we just allow authenticated for now if using secure admin path
CREATE POLICY "Allow authenticated users to select leads" 
ON public.leads FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Allow authenticated users to update leads (status changes)
CREATE POLICY "Allow authenticated users to update leads" 
ON public.leads FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy: Allow authenticated users to delete leads
CREATE POLICY "Allow authenticated users to delete leads" 
ON public.leads FOR DELETE 
TO authenticated 
USING (true);
