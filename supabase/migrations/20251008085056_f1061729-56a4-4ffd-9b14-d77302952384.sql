-- Broadly allow uploads to any bucket for authenticated users (temporary)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' AND tablename='objects' AND policyname='Allow authenticated to upload to any bucket'
  ) THEN
    CREATE POLICY "Allow authenticated to upload to any bucket"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;