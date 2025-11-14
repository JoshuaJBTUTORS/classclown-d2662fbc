-- Add admin access policy to cleo_conversations table
CREATE POLICY "Admins can view all conversations"
ON cleo_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
  )
);