-- Migration: Site Content Management
-- This table stores editorial content, policies, and labels for the storefront

CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- e.g., 'home', 'legal', 'contact'
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Policies for site_content
DROP POLICY IF EXISTS "Public can view site content" ON public.site_content;
CREATE POLICY "Public can view site content" 
ON public.site_content
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
CREATE POLICY "Admins can manage site content" 
ON public.site_content
FOR ALL
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR 
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

-- Insert default content
INSERT INTO public.site_content (key, content, category, description) VALUES
('home_hero_title', 'The Ultimate One-Stop Shop for Everything You Need!', 'home', 'Main heading on the homepage hero section'),
('home_hero_subtitle', 'Discover quality, variety, and unbeatable prices. From trending fashion to cutting-edge tech, find it all at Bloomina.', 'home', 'Sub-heading on the homepage hero section'),
('privacy_policy', '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>', 'legal', 'Privacy policy content'),
('terms_of_service', '<h1>Terms of Service</h1><p>Welcome to Bloomina. By using our services...</p>', 'legal', 'Terms and conditions content'),
('shipping_policy', '<h1>Shipping Policy</h1><p>We deliver nationwide with care...</p>', 'legal', 'Shipping and delivery policy'),
('about_description', 'Bloomina is your premium destination for curated products across all categories.', 'general', 'General about us text'),
('trust_bar_title_1', 'Fast Shipping', 'home', 'First value prop in trust bar'),
('trust_bar_sub_1', 'Across all major cities', 'home', 'First sub-text in trust bar'),
('footer_copyright', '© 2026 Bloomina. All rights reserved.', 'general', 'Copyright text in footer');

