-- Create cleo_lesson_state table for persistent lesson progress
CREATE TABLE public.cleo_lesson_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.cleo_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_plan_id UUID REFERENCES public.cleo_lesson_plans(id) ON DELETE SET NULL,
  active_step INTEGER NOT NULL DEFAULT 0,
  visible_content_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  paused_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_conversation_state UNIQUE(conversation_id)
);

-- Create cleo_question_answers table for Q&A tracking
CREATE TABLE public.cleo_question_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.cleo_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_id TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  step_id TEXT NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_cleo_lesson_state_conversation ON public.cleo_lesson_state(conversation_id);
CREATE INDEX idx_cleo_lesson_state_user ON public.cleo_lesson_state(user_id);
CREATE INDEX idx_cleo_question_answers_conversation ON public.cleo_question_answers(conversation_id);
CREATE INDEX idx_cleo_question_answers_user ON public.cleo_question_answers(user_id);
CREATE INDEX idx_cleo_question_answers_step ON public.cleo_question_answers(step_id);

-- Enable RLS
ALTER TABLE public.cleo_lesson_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_question_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cleo_lesson_state
CREATE POLICY "Users can view their own lesson state"
  ON public.cleo_lesson_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lesson state"
  ON public.cleo_lesson_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson state"
  ON public.cleo_lesson_state FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson state"
  ON public.cleo_lesson_state FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for cleo_question_answers
CREATE POLICY "Users can view their own question answers"
  ON public.cleo_question_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question answers"
  ON public.cleo_question_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add pause/resume tracking to cleo_conversations
ALTER TABLE public.cleo_conversations 
  ADD COLUMN last_paused_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN resume_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN total_pauses INTEGER NOT NULL DEFAULT 0;

-- Create trigger for updated_at on cleo_lesson_state
CREATE TRIGGER update_cleo_lesson_state_updated_at
  BEFORE UPDATE ON public.cleo_lesson_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cleo_updated_at();