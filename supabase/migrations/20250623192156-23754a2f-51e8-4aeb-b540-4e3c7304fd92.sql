
-- Create the homework-submissions storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-submissions', 'homework-submissions', false);

-- Create RLS policies for homework-submissions bucket

-- Policy 1: Students can upload their own submissions
CREATE POLICY "Students can upload homework submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework-submissions' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND is_primary = true) IN ('student', 'parent')
);

-- Policy 2: Students can view their own submissions
CREATE POLICY "Students can view their own homework submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'homework-submissions' AND
  (
    -- Students can see their own files
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND is_primary = true) IN ('student', 'parent') AND
    owner = auth.uid()
  )
);

-- Policy 3: Teachers/admins can view all submissions for marking
CREATE POLICY "Teachers can view all homework submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'homework-submissions' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND is_primary = true) IN ('tutor', 'admin', 'owner')
);

-- Policy 4: Students can update/delete their own submissions
CREATE POLICY "Students can update their own homework submissions"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'homework-submissions' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND is_primary = true) IN ('student', 'parent') AND
  owner = auth.uid()
);

CREATE POLICY "Students can delete their own homework submissions"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'homework-submissions' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND is_primary = true) IN ('student', 'parent') AND
  owner = auth.uid()
);

-- Update existing homework bucket policies to be teacher/admin only
-- First, drop existing policies if they exist (we'll recreate them)
DROP POLICY IF EXISTS "Allow authenticated users to upload homework files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view homework files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update homework files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete homework files" ON storage.objects;

-- Create new restrictive policies for homework bucket (teacher materials only)
CREATE POLICY "Teachers can upload homework materials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'homework' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND is_primary = true) IN ('tutor', 'admin', 'owner')
);

CREATE POLICY "All authenticated users can view homework materials"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'homework');

CREATE POLICY "Teachers can update homework materials"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'homework' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND is_primary = true) IN ('tutor', 'admin', 'owner')
);

CREATE POLICY "Teachers can delete homework materials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'homework' AND
  (SELECT role FROM public.user_roles WHERE user_id = auth.uid() AND is_primary = true) IN ('tutor', 'admin', 'owner')
);
