CREATE POLICY "Public read tutor documents"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'tutor-documents');

CREATE POLICY "Authenticated upload tutor documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tutor-documents');

CREATE POLICY "Authenticated update tutor documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tutor-documents');