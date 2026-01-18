-- Create table to track batch marking jobs
CREATE TABLE public.marking_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
  total_responses INTEGER NOT NULL DEFAULT 0,
  marked_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  last_processed_response_id UUID NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.marking_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can view and manage marking jobs
CREATE POLICY "Admins can view marking jobs" 
ON public.marking_jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can create marking jobs" 
ON public.marking_jobs 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can update marking jobs" 
ON public.marking_jobs 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'owner')
  )
);

-- Add trigger to update updated_at
CREATE TRIGGER update_marking_jobs_updated_at
BEFORE UPDATE ON public.marking_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add AI marking columns to student_responses if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_responses' AND column_name = 'ai_feedback') THEN
    ALTER TABLE public.student_responses ADD COLUMN ai_feedback TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_responses' AND column_name = 'marking_breakdown') THEN
    ALTER TABLE public.student_responses ADD COLUMN marking_breakdown JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_responses' AND column_name = 'confidence_score') THEN
    ALTER TABLE public.student_responses ADD COLUMN confidence_score NUMERIC(3,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_responses' AND column_name = 'marked_at') THEN
    ALTER TABLE public.student_responses ADD COLUMN marked_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_responses' AND column_name = 'marked_by') THEN
    ALTER TABLE public.student_responses ADD COLUMN marked_by TEXT DEFAULT 'ai';
  END IF;
END $$;

-- Add index for faster unmarked response queries
CREATE INDEX IF NOT EXISTS idx_student_responses_unmarked 
ON public.student_responses(session_id) 
WHERE marked_at IS NULL;