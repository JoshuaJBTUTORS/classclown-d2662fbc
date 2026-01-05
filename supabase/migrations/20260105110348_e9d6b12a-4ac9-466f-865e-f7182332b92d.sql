-- Create table to store HeyCleo homework completion data
CREATE TABLE public.heycleo_homework_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiers
  homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id BIGINT REFERENCES public.students(id) ON DELETE CASCADE,
  heycleo_user_id UUID,
  conversation_id UUID,
  
  -- Completion details
  completed_at TIMESTAMPTZ NOT NULL,
  time_spent_seconds INTEGER,
  
  -- Score information
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  accuracy_percentage INTEGER DEFAULT 0,
  
  -- Individual question breakdown
  question_details JSONB,
  
  -- Metadata
  received_at TIMESTAMPTZ DEFAULT NOW(),
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(homework_id, student_id, conversation_id)
);

-- Enable RLS
ALTER TABLE public.heycleo_homework_completions ENABLE ROW LEVEL SECURITY;

-- Policies for admin/owner access
CREATE POLICY "Admins can view all completions" ON public.heycleo_homework_completions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

CREATE POLICY "Admins can insert completions" ON public.heycleo_homework_completions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update completions" ON public.heycleo_homework_completions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner'))
  );

-- Trigger for updated_at
CREATE TRIGGER update_heycleo_homework_completions_updated_at
  BEFORE UPDATE ON public.heycleo_homework_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX idx_heycleo_homework_completions_homework_id ON public.heycleo_homework_completions(homework_id);
CREATE INDEX idx_heycleo_homework_completions_student_id ON public.heycleo_homework_completions(student_id);