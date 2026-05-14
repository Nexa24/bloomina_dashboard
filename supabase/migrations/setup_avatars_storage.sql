-- Setup Storage for Admin Avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
DROP POLICY IF EXISTS "Public Access to Avatars" ON storage.objects;
CREATE POLICY "Public Access to Avatars" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Admins can upload avatars" ON storage.objects;
CREATE POLICY "Admins can upload avatars" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Admins can update avatars" ON storage.objects;
CREATE POLICY "Admins can update avatars" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Admins can delete avatars" ON storage.objects;
CREATE POLICY "Admins can delete avatars" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'avatars');
