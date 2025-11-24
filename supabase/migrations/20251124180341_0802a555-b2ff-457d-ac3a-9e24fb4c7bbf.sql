-- Add policy allowing admins/owners to view all messages in Cleo Tracker
CREATE POLICY "Admins and owners can view all messages"
ON public.cleo_messages
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'owner'::app_role)
);