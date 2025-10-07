-- Drop the restrictive policy that was checking primary roles
DROP POLICY IF EXISTS "Teachers can upload homework materials" ON storage.objects;

-- Create a new permissive policy for homework uploads
CREATE POLICY "Anyone authenticated can upload to homework"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'homework');