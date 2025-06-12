
-- Add RLS policies for the students table to allow admins/owners to create trial accounts

-- Enable RLS on students table (if not already enabled)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins and owners can view all students" ON public.students;
DROP POLICY IF EXISTS "Students can view their own record" ON public.students;
DROP POLICY IF EXISTS "Parents can view their students" ON public.students;
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

-- Allow students to view their own record
CREATE POLICY "Students can view their own record" 
ON public.students
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Allow parents to view their students
CREATE POLICY "Parents can view their students" 
ON public.students
FOR SELECT 
TO authenticated
USING (
  parent_id IN (
    SELECT id FROM public.parents WHERE user_id = auth.uid()
  )
);

-- Allow admins and owners to insert student records (including trial accounts)
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

-- Allow admins and owners to update student records
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

-- Allow admins and owners to delete student records
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
