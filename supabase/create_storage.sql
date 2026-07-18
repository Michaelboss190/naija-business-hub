-- Create resources storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', true);

-- Allow public access
CREATE POLICY "Public can view resources" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Auth users can upload resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources');
CREATE POLICY "Auth users can update resources" ON storage.objects FOR UPDATE USING (bucket_id = 'resources');