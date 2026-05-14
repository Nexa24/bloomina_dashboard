-- Update Privacy Policy and Terms of Service with specific content
-- Run this in your Supabase SQL Editor

-- 1. Update Privacy Policy
UPDATE public.legal_documents
SET content = null,
    sections = '[
        {
            "type": "hero",
            "tag": "SECURITY & TRUST",
            "title": "Privacy Policy",
            "content": "Last updated: October 2026. We value your privacy and are committed to protecting your personal data."
        },
        {
            "type": "grid",
            "title": "CORE PROTECTION",
            "items": [
                {
                    "icon": "Eye",
                    "title": "1. Information We Collect",
                    "content": "We collect several different types of information for various purposes to provide and improve our Service to you, including Personal Data (like email address, first and last name, phone number, address) and Usage Data (such as IP address, browser type, pages visited, time spent)."
                },
                {
                    "icon": "Lock",
                    "title": "2. Use of Data",
                    "content": "Bloomina uses the collected data to provide and maintain our Service, notify you about changes, allow you to participate in interactive features, provide customer support, gather analysis or valuable information, and detect, prevent, and address technical issues."
                },
                {
                    "icon": "Shield",
                    "title": "3. Data Security",
                    "content": "The security of your data is important to us, but remember that no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security."
                },
                {
                    "icon": "Clock",
                    "title": "4. Cookies Data",
                    "content": "We use cookies and similar tracking technologies to track the activity on our Service and we hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent via your browser settings."
                }
            ]
        },
        {
            "type": "cta",
            "title": "Questions about your data?",
            "subtitle": "Our legal team is available to explain our data practices in detail. We believe in 100% transparency.",
            "link": "/contact",
            "linkText": "Contact Privacy Officer"
        }
    ]'::jsonb
WHERE slug = 'privacy-policy';

-- 2. Update Terms of Service
UPDATE public.legal_documents
SET content = null,
    sections = '[
        {
            "type": "hero",
            "tag": "LEGAL FRAMEWORK",
            "title": "Terms & Conditions",
            "content": "Last updated: October 2026. By using our services, you agree to the following terms and conditions."
        },
        {
            "type": "grid",
            "title": "USER AGREEMENTS",
            "items": [
                {
                    "icon": "CheckCircle",
                    "title": "1. Agreement to Terms",
                    "content": "By accessing or using Bloomina, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you disagree with any part of the terms, then you may not access the service."
                },
                {
                    "icon": "Award",
                    "title": "2. Intellectual Property",
                    "content": "The Service and its original content, features, and functionality are and will remain the exclusive property of Bloomina and its licensors. The Service is protected by copyright, trademark, and international laws."
                },
                {
                    "icon": "Shield",
                    "title": "3. User Accounts",
                    "content": "When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate account termination."
                },
                {
                    "icon": "Lock",
                    "title": "4. Limitation of Liability",
                    "content": "In no event shall Bloomina, nor its directors, employees, or affiliates, be liable for any indirect, incidental, or consequential damages resulting from your access to or use of the Service."
                }
            ]
        },
        {
            "type": "cta",
            "title": "5. Changes to Terms",
            "subtitle": "We reserve the right to modify or replace these Terms at any time. Material changes will be determined at our sole discretion.",
            "link": "/support",
            "linkText": "Contact Support"
        }
    ]'::jsonb
WHERE slug = 'terms-of-service';

