-- Add the missing standard legal pages to the database
INSERT INTO public.legal_documents (slug, title, content, sections) VALUES
('privacy-policy', 'Privacy Policy', '', '[]'),
('terms-of-service', 'Terms of Service', '', '[]'),
('shipping-information', 'Shipping Information', '', '[]')
ON CONFLICT (slug) DO NOTHING;
