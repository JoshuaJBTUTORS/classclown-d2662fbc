-- Create junction table for course to exam board specifications (one-to-many)
CREATE TABLE IF NOT EXISTS public.course_exam_board_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_board_specification_id UUID NOT NULL REFERENCES public.exam_board_specifications(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, exam_board_specification_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_exam_specs_course_id ON public.course_exam_board_specifications(course_id);
CREATE INDEX IF NOT EXISTS idx_course_exam_specs_spec_id ON public.course_exam_board_specifications(exam_board_specification_id);
CREATE INDEX IF NOT EXISTS idx_course_exam_specs_default ON public.course_exam_board_specifications(course_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.course_exam_board_specifications ENABLE ROW LEVEL SECURITY;

-- Anyone can view course-specification links
CREATE POLICY "Anyone can view course exam board links"
ON public.course_exam_board_specifications
FOR SELECT
USING (true);

-- Only admins/owners can manage links
CREATE POLICY "Admins can manage course exam board links"
ON public.course_exam_board_specifications
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Migrate existing data from courses.exam_board_specification_id
INSERT INTO public.course_exam_board_specifications (course_id, exam_board_specification_id, is_default)
SELECT 
  id as course_id,
  exam_board_specification_id,
  true as is_default
FROM public.courses
WHERE exam_board_specification_id IS NOT NULL
ON CONFLICT (course_id, exam_board_specification_id) DO NOTHING;

-- Create helper function to get course specifications
CREATE OR REPLACE FUNCTION get_course_exam_board_specifications(course_id_param UUID)
RETURNS TABLE (
  specification_id UUID,
  exam_board TEXT,
  subject_name TEXT,
  is_default BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    ebs.id,
    ebs.exam_board,
    s.name,
    cebs.is_default
  FROM course_exam_board_specifications cebs
  JOIN exam_board_specifications ebs ON cebs.exam_board_specification_id = ebs.id
  LEFT JOIN subjects s ON ebs.subject_id = s.id
  WHERE cebs.course_id = course_id_param
  ORDER BY cebs.is_default DESC, ebs.exam_board;
$$;