-- Allow admins and owners to view all voice session logs
CREATE POLICY "Admins can view all voice session logs"
ON voice_session_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);