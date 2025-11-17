-- Create table for weekly topic to Cleo module mappings
CREATE TABLE IF NOT EXISTS public.weekly_topic_module_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  weekly_topic_title TEXT NOT NULL,
  course_module_id UUID REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_weekly_topic_mappings_subject 
  ON public.weekly_topic_module_mappings(subject, weekly_topic_title);

-- Enable RLS
ALTER TABLE public.weekly_topic_module_mappings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read mappings
CREATE POLICY "Authenticated users can view mappings"
  ON public.weekly_topic_module_mappings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins and owners to manage mappings
CREATE POLICY "Admins can manage mappings"
  ON public.weekly_topic_module_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_weekly_topic_mappings_updated_at
  BEFORE UPDATE ON public.weekly_topic_module_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();