
-- Create a new type for study techniques to ensure data integrity
CREATE TYPE public.study_technique_enum AS ENUM ('pomodoro', 'subject_rotation', '60_10_rule', 'none');

-- Add columns for new features to the revision_schedules table
ALTER TABLE public.revision_schedules
ADD COLUMN study_technique public.study_technique_enum NOT NULL DEFAULT 'none',
ADD COLUMN daily_start_time TIME NOT NULL DEFAULT '09:00:00';

-- Add a column to support soft-deleting schedules for the "reset" feature
ALTER TABLE public.revision_schedules
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Add a column to revision_sessions to distinguish between study time and breaks
ALTER TABLE public.revision_sessions
ADD COLUMN session_type TEXT NOT NULL DEFAULT 'study' CHECK (session_type IN ('study', 'break'));

-- Update RLS policy on revision_schedules to hide soft-deleted records from view
DROP POLICY IF EXISTS "Users can view their own revision schedules" ON public.revision_schedules;
CREATE POLICY "Users can view their own revision schedules"
  ON public.revision_schedules
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);
