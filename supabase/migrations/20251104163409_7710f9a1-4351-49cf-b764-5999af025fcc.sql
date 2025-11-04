-- Create table for AI-generated lesson plans (Cleo)
CREATE TABLE IF NOT EXISTS public.cleo_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  conversation_id UUID,
  topic TEXT NOT NULL,
  year_group TEXT NOT NULL,
  learning_objectives JSONB DEFAULT '[]'::jsonb,
  teaching_sequence JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for lesson content blocks
CREATE TABLE IF NOT EXISTS public.lesson_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID NOT NULL REFERENCES public.cleo_lesson_plans(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('table', 'definition', 'question', 'diagram', 'text')),
  sequence_order INTEGER NOT NULL,
  step_id TEXT NOT NULL,
  title TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  teaching_notes TEXT DEFAULT '',
  prerequisites JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cleo_lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_content_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cleo_lesson_plans
CREATE POLICY "Users can view their own lesson plans"
  ON public.cleo_lesson_plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own lesson plans"
  ON public.cleo_lesson_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own lesson plans"
  ON public.cleo_lesson_plans FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for lesson_content_blocks
CREATE POLICY "Users can view lesson content blocks"
  ON public.lesson_content_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cleo_lesson_plans
      WHERE cleo_lesson_plans.id = lesson_content_blocks.lesson_plan_id
    )
  );

CREATE POLICY "Users can create lesson content blocks"
  ON public.lesson_content_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cleo_lesson_plans
      WHERE cleo_lesson_plans.id = lesson_content_blocks.lesson_plan_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cleo_lesson_plans_lesson_id ON public.cleo_lesson_plans(lesson_id);
CREATE INDEX IF NOT EXISTS idx_cleo_lesson_plans_conversation_id ON public.cleo_lesson_plans(conversation_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_blocks_lesson_plan_id ON public.lesson_content_blocks(lesson_plan_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_blocks_sequence ON public.lesson_content_blocks(lesson_plan_id, sequence_order);

-- Create trigger for updated_at
CREATE TRIGGER update_cleo_lesson_plans_updated_at
  BEFORE UPDATE ON public.cleo_lesson_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();