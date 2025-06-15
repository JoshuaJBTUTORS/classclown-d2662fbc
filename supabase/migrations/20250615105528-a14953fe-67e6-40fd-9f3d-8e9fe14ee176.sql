
-- Drop the existing update policy, which is too restrictive
DROP POLICY IF EXISTS "Users can update their own revision schedules" ON public.revision_schedules;

-- Recreate the update policy. The USING clause is sufficient for security.
CREATE POLICY "Users can update their own revision schedules"
ON public.revision_schedules
FOR UPDATE
USING (auth.uid() = user_id);

-- Clean up by dropping an old insert policy from a previous migration that might be causing conflicts.
-- The policy "Users can insert their own revision schedules" already covers this.
DROP POLICY IF EXISTS "Users can create their own revision schedules" ON public.revision_schedules;
