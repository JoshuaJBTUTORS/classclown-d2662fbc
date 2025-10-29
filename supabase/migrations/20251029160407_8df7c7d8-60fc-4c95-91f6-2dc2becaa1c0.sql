-- Create table to track failed LessonSpace room creation attempts
CREATE TABLE IF NOT EXISTS public.failed_room_creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  error_message TEXT,
  error_code INTEGER,
  attempt_count INTEGER DEFAULT 1,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id)
);

-- Create index for querying unresolved failures
CREATE INDEX IF NOT EXISTS idx_failed_room_creations_unresolved 
ON public.failed_room_creations(resolved, last_attempt_at) 
WHERE resolved = FALSE;

-- Create index for lesson lookups
CREATE INDEX IF NOT EXISTS idx_failed_room_creations_lesson_id 
ON public.failed_room_creations(lesson_id);

-- Enable RLS
ALTER TABLE public.failed_room_creations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admins/owners to view and manage failed room creations
CREATE POLICY "Admins and owners can view failed room creations"
ON public.failed_room_creations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins and owners can update failed room creations"
ON public.failed_room_creations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Create a view for monitoring dashboard
CREATE OR REPLACE VIEW public.failed_room_creations_summary AS
SELECT 
  COUNT(*) FILTER (WHERE resolved = FALSE) as unresolved_count,
  COUNT(*) FILTER (WHERE resolved = TRUE) as resolved_count,
  COUNT(*) as total_count,
  MAX(last_attempt_at) FILTER (WHERE resolved = FALSE) as last_failure_at,
  AVG(attempt_count) FILTER (WHERE resolved = FALSE) as avg_attempts_unresolved
FROM public.failed_room_creations;

-- Grant access to the view
GRANT SELECT ON public.failed_room_creations_summary TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_failed_room_creations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_failed_room_creations_updated_at
BEFORE UPDATE ON public.failed_room_creations
FOR EACH ROW
EXECUTE FUNCTION public.update_failed_room_creations_updated_at();

COMMENT ON TABLE public.failed_room_creations IS 'Tracks failed LessonSpace room creation attempts for monitoring and retry';
COMMENT ON COLUMN public.failed_room_creations.error_code IS 'HTTP error code (e.g., 429 for rate limiting)';
COMMENT ON COLUMN public.failed_room_creations.attempt_count IS 'Number of times room creation was attempted';
COMMENT ON COLUMN public.failed_room_creations.resolved IS 'Whether the issue has been resolved (room successfully created)';
