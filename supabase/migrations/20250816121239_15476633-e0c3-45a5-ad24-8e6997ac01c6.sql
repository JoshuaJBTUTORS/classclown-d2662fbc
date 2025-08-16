-- Fix storage RLS policy for teaching-materials bucket to allow tutors to upload
DROP POLICY IF EXISTS "Tutors can upload teaching materials" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload teaching materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage teaching materials" ON storage.objects;

-- Create comprehensive policies for teaching-materials bucket
CREATE POLICY "Admins can manage all teaching materials" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'teaching-materials' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Tutors can upload their own teaching materials" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'teaching-materials' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'tutor'
  )
);

CREATE POLICY "Tutors can view all teaching materials" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'teaching-materials' 
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'tutor')
  )
);

CREATE POLICY "Tutors can delete their own teaching materials" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'teaching-materials' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
    OR 
    (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'tutor'
      )
      AND owner = auth.uid()
    )
  )
);