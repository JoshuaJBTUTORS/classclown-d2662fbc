
-- Update the RLS policy on subjects table to allow anonymous users to view subjects
-- This is needed for the trial booking page which is accessed by non-authenticated users
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;

CREATE POLICY "Anyone can view subjects" 
ON public.subjects
FOR SELECT 
TO authenticated, anon
USING (true);
