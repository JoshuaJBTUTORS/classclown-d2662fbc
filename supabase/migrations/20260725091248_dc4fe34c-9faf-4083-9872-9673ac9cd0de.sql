CREATE POLICY "Public read of tutor agreement PDF"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'tutor-documents'
  AND name = 'self-employed-tutor-agreement.pdf'
);