
-- Drop the existing update policy if it exists, to recreate it correctly
DROP POLICY IF EXISTS "Users can update their own revision schedules" ON public.revision_schedules;

-- Create policy to allow users to update their own revision schedules
CREATE POLICY "Users can update their own revision schedules"
ON public.revision_schedules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Drop the existing insert policy if it exists, to create it
DROP POLICY IF EXISTS "Users can insert their own revision schedules" ON public.revision_schedules;

-- Create policy to allow users to insert their own revision schedules
CREATE POLICY "Users can insert their own revision schedules"
ON public.revision_schedules
FOR INSERT
WITH CHECK (auth.uid() = user_id);
