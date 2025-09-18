-- Update RLS policies for topic_requests to allow admins/owners to create requests
DROP POLICY IF EXISTS "Users can create their own topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can view their own topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can update their own topic requests" ON topic_requests;

-- Allow students and parents to create their own requests
CREATE POLICY "Students and parents can create topic requests" ON topic_requests
FOR INSERT 
WITH CHECK (
  -- Students can create requests for themselves
  (student_id IS NOT NULL AND student_id IN (
    SELECT s.id FROM students s 
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
  OR
  -- Parents can create requests (student_id can be null or for their children)
  (parent_id IS NOT NULL AND parent_id IN (
    SELECT p.id FROM parents p 
    WHERE p.user_id = auth.uid()
  ))
  OR
  -- Admins and owners can create requests on behalf of others
  (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  ))
);

-- Allow users to view relevant topic requests
CREATE POLICY "Users can view relevant topic requests" ON topic_requests
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
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
  OR
  -- Parents can see requests they created or for their children
  (parent_id IS NOT NULL AND parent_id IN (
    SELECT p.id FROM parents p 
    WHERE p.user_id = auth.uid()
  ))
  OR
  (student_id IS NOT NULL AND student_id IN (
    SELECT s.id FROM students s 
    WHERE s.parent_id IN (
      SELECT p.id FROM parents p 
      WHERE p.user_id = auth.uid()
    )
  ))
);

-- Allow admins to update topic requests (for approval/denial)
CREATE POLICY "Admins can update topic requests" ON topic_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);