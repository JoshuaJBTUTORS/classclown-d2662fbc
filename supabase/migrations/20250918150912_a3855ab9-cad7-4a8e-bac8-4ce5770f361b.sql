-- Drop all existing policies for topic_requests
DROP POLICY IF EXISTS "Students and parents can create topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can create their own topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can view their own topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can update their own topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Users can view relevant topic requests" ON topic_requests;
DROP POLICY IF EXISTS "Admins can update topic requests" ON topic_requests;

-- Create new comprehensive policies
CREATE POLICY "Allow topic request creation" ON topic_requests
FOR INSERT 
WITH CHECK (
  -- Students can create requests for themselves
  (student_id IS NOT NULL AND student_id IN (
    SELECT s.id FROM students s 
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
  OR
  -- Parents can create requests
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
CREATE POLICY "Allow topic request viewing" ON topic_requests
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

-- Allow admins to update topic requests
CREATE POLICY "Allow topic request updates" ON topic_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);