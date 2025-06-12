
-- Add RLS policies for the parents table to allow admins/owners to create trial accounts

-- Enable RLS on parents table (if not already enabled)
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins and owners can view all parents" ON public.parents;
DROP POLICY IF EXISTS "Parents can view their own record" ON public.parents;
DROP POLICY IF EXISTS "Admins and owners can insert parents" ON public.parents;
DROP POLICY IF EXISTS "Admins and owners can update parents" ON public.parents;
DROP POLICY IF EXISTS "Admins and owners can delete parents" ON public.parents;

-- Allow authenticated users to view all parents if they are admin/owner
CREATE POLICY "Admins and owners can view all parents" 
ON public.parents
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Allow parents to view their own record
CREATE POLICY "Parents can view their own record" 
ON public.parents
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Allow admins and owners to insert parent records (including trial accounts)
CREATE POLICY "Admins and owners can insert parents" 
ON public.parents
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Allow admins and owners to update parent records
CREATE POLICY "Admins and owners can update parents" 
ON public.parents
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Allow admins and owners to delete parent records
CREATE POLICY "Admins and owners can delete parents" 
ON public.parents
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);
