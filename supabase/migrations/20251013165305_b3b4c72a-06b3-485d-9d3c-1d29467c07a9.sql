-- Add explicit SELECT policy for owners to view all content videos
CREATE POLICY "Owners can view all content videos"
ON public.content_videos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'owner'::app_role
  )
);