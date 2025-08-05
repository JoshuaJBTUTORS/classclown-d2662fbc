-- Add DELETE policy for tutors table
CREATE POLICY "Admins and owners can delete tutors" 
ON public.tutors 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

-- Improve UPDATE policy for tutors table to be more restrictive
DROP POLICY IF EXISTS "Allow authenticated users to update tutors" ON public.tutors;

CREATE POLICY "Admins and owners can update tutors" 
ON public.tutors 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));