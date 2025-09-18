-- Create security definer function to safely get current user's email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop all existing policies for topic_requests to start fresh
DROP POLICY IF EXISTS "Allow topic request creation" ON topic_requests;
DROP POLICY IF EXISTS "Allow topic request viewing" ON topic_requests;
DROP POLICY IF EXISTS "Allow topic request updates" ON topic_requests;
DROP POLICY IF EXISTS "Students and parents can create topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can create their own topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can view their own topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can update their own topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can view relevant topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Admins can update topic requests" ON topic_requests;

-- Create comprehensive INSERT policy
CREATE POLICY "topic_requests_insert_policy" ON topic_requests
FOR INSERT 
WITH CHECK (
  -- Students can create requests for themselves
  (student_id IS NOT NULL AND student_id IN (
    SELECT s.id FROM students s 
    WHERE s.email = public.get_current_user_email()
  ))
  OR
  -- Parents can create requests
  (parent_id IS NOT NULL AND parent_id = public.get_current_user_parent_id())
  OR
  -- Admins and owners can create requests on behalf of others
  (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  ))
);

-- Create comprehensive SELECT policy
CREATE POLICY "topic_requests_select_policy" ON topic_requests
FOR SELECT USING (
  -- Admins and owners can see all
  (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  ))
  OR
  -- Students can see their own requests
  (student_id IS NOT NULL AND student_id IN (
    SELECT s.id FROM students s 
    WHERE s.email = public.get_current_user_email()
  ))
  OR
  -- Parents can see requests they created
  (parent_id IS NOT NULL AND parent_id = public.get_current_user_parent_id())
  OR
  -- Parents can see requests for their children
  (student_id IS NOT NULL AND student_id IN (
    SELECT s.id FROM students s 
    WHERE s.parent_id = public.get_current_user_parent_id()
  ))
);

-- Create comprehensive UPDATE policy
CREATE POLICY "topic_requests_update_policy" ON topic_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Create comprehensive DELETE policy (if needed)
CREATE POLICY "topic_requests_delete_policy" ON topic_requests
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);