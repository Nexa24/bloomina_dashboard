-- Create hero_slides table
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    tag TEXT, -- Trending, New, etc
    subtitle TEXT,
    image_url TEXT NOT NULL,
    button_text TEXT,
    button_link TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    content_position TEXT DEFAULT 'middle-left', 
    text_align TEXT DEFAULT 'left',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was created in an earlier step
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS tag TEXT;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS content_position TEXT DEFAULT 'middle-left';
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS text_align TEXT DEFAULT 'left';
ALTER TABLE public.hero_slides ALTER COLUMN title DROP NOT NULL;

-- Enable RLS for hero_slides
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Policies for hero_slides
DROP POLICY IF EXISTS "Allow public read on hero_slides" ON public.hero_slides;
CREATE POLICY "Allow public read on hero_slides" ON public.hero_slides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin all on hero_slides" ON public.hero_slides;
CREATE POLICY "Allow admin all on hero_slides" ON public.hero_slides FOR ALL USING (true) WITH CHECK (true);

-- Legal Documents Table
DROP TABLE IF EXISTS public.legal_documents;
CREATE TABLE public.legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, 
    title TEXT NOT NULL,
    content TEXT, 
    sections JSONB DEFAULT '[]', 
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Legal Documents
INSERT INTO public.legal_documents (slug, title, sections) VALUES
('why-Bloomina', 'Why Bloomina?', '[
    {"type": "hero", "tag": "OUR PHILOSOPHY", "title": "Why Bloomina?", "content": "We don’t just sell products; we deliver carefully curated experiences. Discover what makes us the trusted choice for thousands of modern shoppers."},
    {"type": "grid", "title": "The Bloomina Difference", "subtitle": "Our unique selling propositions that set us apart from the rest.", "items": [
        {"icon": "Award", "title": "Premium Quality", "content": "Every item in our catalog is rigorously tested for durability, performance, and aesthetic appeal. We only stock the best."},
        {"icon": "Leaf", "title": "Ethical Sourcing", "content": "We partner directly with transparent manufacturers who adhere to strict ethical labor and environmental standards."},
        {"icon": "Users", "title": "Community First", "content": "You are not just a customer; you’re part of the Bloomina community. Our support team is dedicated to your complete satisfaction."}
    ]},
    {"type": "guarantees", "title": "Our Ironclad Guarantees", "subtitle": "Shopping online should be stress-free. We remove the risk so you can shop with confidence.", "items": [
        {"icon": "ShieldCheck", "title": "100% Authentic Products", "content": "We guarantee the authenticity of every single item we sell. Sourced directly from brands or authorized distributors."},
        {"icon": "RotateCcw", "title": "30-Day Easy Returns", "content": "Change your mind? No problem. Return any unused item within 30 days for a full refund, no questions asked."},
        {"icon": "Truck", "title": "Lightning Fast Shipping", "content": "Most orders are processed within 24 hours. Enjoy free expedited shipping on all orders over ₹4,000."}
    ]}
]'),
('returns-refunds', 'Returns & Refunds', '[
    {"type": "simple-hero", "icon": "RotateCcw", "title": "Returns & Refunds", "content": "We want you to love your Bloomina purchase. If you’re not completely satisfied, our hassle-free return process makes it easy to send items back."},
    {"type": "cards", "items": [
        {"icon": "RotateCcw", "title": "14-Day Easy Returns", "content": "Return any unworn, unwashed item with tags attached within 14 days of delivery for a full refund."},
        {"icon": "ShieldCheck", "title": "Quality Guarantee", "content": "If your item arrives damaged or defective, we will replace it immediately at no extra cost to you."},
        {"icon": "CreditCard", "title": "Fast Refunds", "content": "Once we receive your return, refunds are processed back to your original payment method within 3-5 business days."},
        {"icon": "Clock", "title": "Exchanges", "content": "Need a different size? We offer free exchanges to ensure you get the perfect fit."}
    ]},
    {"type": "how-it-works", "title": "How It Works", "steps": [
        {"id": "01", "title": "Initiate Return", "content": "Log into your account, find the order, and select the items you wish to return."},
        {"id": "02", "title": "Print Label", "content": "Download and print the pre-paid shipping label provided in your email."},
        {"id": "03", "title": "Pack Items", "content": "Securely pack the items in their original packaging, ensuring all tags are attached."},
        {"id": "04", "title": "Drop Off", "content": "Drop the package at your nearest partner courier location."}
    ]}
]'),
('faq', 'Help Center / FAQ', '[
    {"type": "faq-hero", "title": "FAQ", "subtitle": "Find answers to the most common questions about Bloomina."},
    {"type": "faq-category", "title": "Orders & Shipping", "items": [
        {"q": "When will my order ship?", "a": "Most orders are processed within 24 hours (excluding weekends and holidays)."},
        {"q": "Do you offer free shipping?", "a": "Yes! We offer free standard shipping on all orders over ₹4,000."},
        {"q": "Can I change or cancel my order?", "a": "Orders can be modified within 1 hour of placement. Contact support immediately."}
    ]},
    {"type": "faq-category", "title": "Returns & Refunds", "items": [
        {"q": "What is your return policy?", "a": "We offer a 14-day return policy for unused items in original packaging."},
        {"q": "How long does a refund take?", "a": "Refunds typically appear in your account within 3-5 business days after processing."}
    ]}
]'),
('shipping-information', 'Shipping Information', '[
    {"type": "shipping-hero", "title": "Shipping & Returns", "subtitle": "Everything you need to know about how we ship your orders and handle returns."},
    {"type": "shipping-grid", "items": [
        {"icon": "Truck", "title": "Standard Delivery", "time": "3–5 Business Days", "price": "FREE", "detail": "On orders over ₹4,000", "color": "bg-blue-100 text-[#1B4F9C]"},
        {"icon": "Package", "title": "Express Delivery", "time": "1–2 Business Days", "price": "₹125", "detail": "Flat rate, any order size", "color": "bg-orange-100 text-orange-600"},
        {"icon": "Clock", "title": "Overnight Delivery", "time": "Next Business Day", "price": "₹250", "detail": "Order before 12 PM IST", "color": "bg-purple-100 text-purple-600"}
    ]},
    {"type": "processing-info", "title": "Processing Times", "items": [
        "Orders placed before 3 PM IST are processed the same day",
        "Orders after 3 PM process the next business day",
        "No processing on weekends & public holidays"
    ]},
    {"type": "rates-table", "title": "Rate Summary", "headers": ["Order Value", "Standard", "Express", "Overnight"], "rows": [
        ["Under ₹4,000", "₹200", "₹125", "₹250"],
        ["₹4,000 and above", "FREE", "₹125", "₹250"]
    ]},
    {"type": "policy-grid", "sections": [
        {"title": "Items we accept", "icon": "CheckCircle", "color": "bg-green-100 text-green-600", "items": ["Returned within 30 days of delivery", "Unused and in original condition", "Original packaging & tags intact", "Electronics with all accessories included"]},
        {"title": "Non-returnable items", "icon": "XCircle", "color": "bg-red-100 text-red-500", "items": ["Items marked \"Final Sale\"", "Opened personal hygiene products", "Perishable goods", "Damaged by misuse"]}
    ]},
    {"type": "process-steps", "title": "Refund Process", "steps": [
        {"id": "1", "title": "Submit your return request", "content": "Visit the Returns page or contact support with your ID.", "time": "Day 1"},
        {"id": "2", "title": "We arrange pickup", "content": "A free pickup will be scheduled within 1–2 days.", "time": "1–2 days"},
        {"id": "3", "title": "Item inspection", "content": "Our team inspects it within 2 business days.", "time": "2–3 days"},
        {"id": "4", "title": "Refund issued", "content": "Approved refunds are credited back.", "time": "3–5 days"}
    ]}
]'),
('privacy-policy', 'Privacy Policy', '[]'),
('terms-of-service', 'Terms of Service', '[]');

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read-only access" ON public.legal_documents;
CREATE POLICY "Allow public read-only access" ON public.legal_documents FOR SELECT USING (true);

-- Admin Policies (Explicitly allow SELECT, INSERT, UPDATE. No DELETE allowed)
DROP POLICY IF EXISTS "Allow admin full access" ON public.legal_documents;
DROP POLICY IF EXISTS "Allow admin select" ON public.legal_documents;
DROP POLICY IF EXISTS "Allow admin update" ON public.legal_documents;
DROP POLICY IF EXISTS "Allow admin insert" ON public.legal_documents;

CREATE POLICY "Allow admin select" ON public.legal_documents 
FOR SELECT USING (auth.jwt() ->> 'email' = 'designbynexa.in@gmail.com');

CREATE POLICY "Allow admin insert" ON public.legal_documents 
FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'designbynexa.in@gmail.com');

CREATE POLICY "Allow admin update" ON public.legal_documents 
FOR UPDATE USING (auth.jwt() ->> 'email' = 'designbynexa.in@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'designbynexa.in@gmail.com');

-- Configure Supabase Storage Bucket for Hero Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Setup Storage Policies for the ''assets'' bucket
DROP POLICY IF EXISTS "Public Asset Read" ON storage.objects;
CREATE POLICY "Public Asset Read" ON storage.objects FOR SELECT USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Admin Asset Upload" ON storage.objects;
CREATE POLICY "Admin Asset Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assets');

DROP POLICY IF EXISTS "Admin Asset Update" ON storage.objects;
CREATE POLICY "Admin Asset Update" ON storage.objects FOR UPDATE USING (bucket_id = 'assets');

DROP POLICY IF EXISTS "Admin Asset Delete" ON storage.objects;
CREATE POLICY "Admin Asset Delete" ON storage.objects FOR DELETE USING (bucket_id = 'assets');


