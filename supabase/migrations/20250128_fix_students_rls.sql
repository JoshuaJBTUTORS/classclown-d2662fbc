
-- First, drop the function that references non-existent column
DROP FUNCTION IF EXISTS public.get_current_user_organization();

-- Recreate the RLS policies without organization references
-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "Admins and owners can view all students" ON public.students;
DROP POLICY IF EXISTS "Parents can view their children" ON public.students;
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;
DROP POLICY IF EXISTS "Admins and owners can insert students" ON public.students;
DROP POLICY IF EXISTS "Admins and owners can update students" ON public.students;
DROP POLICY IF EXISTS "Admins and owners can delete students" ON public.students;

-- Allow authenticated users to view all students if they are admin/owner
CREATE POLICY "Admins and owners can view all students" 
ON public.students
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Allow parents to view their own children
CREATE POLICY "Parents can view their children" 
ON public.students
FOR SELECT 
TO authenticated
USING (
  parent_id IN (
    SELECT id FROM public.parents WHERE user_id = auth.uid()
  )
);

-- Allow students to view their own record if they have a user account
CREATE POLICY "Students can view their own record" 
ON public.students
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Allow admins and owners to insert students
CREATE POLICY "Admins and owners can insert students" 
ON public.students
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Allow admins and owners to update students
CREATE POLICY "Admins and owners can update students" 
ON public.students
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Allow admins and owners to delete students
CREATE POLICY "Admins and owners can delete students" 
ON public.students
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);
