-- Create module_assessments table to link AI assessments to course modules
CREATE TABLE public.module_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.ai_assessments(id) ON DELETE CASCADE,
  is_required BOOLEAN NOT NULL DEFAULT true,
  passing_score INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(module_id, assessment_id)
);

-- Enable RLS
ALTER TABLE public.module_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for module_assessments
CREATE POLICY "Admins can manage module assessments" 
ON public.module_assessments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner', 'tutor')
));

CREATE POLICY "Users can view module assessments" 
ON public.module_assessments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM course_modules cm
  JOIN courses c ON c.id = cm.course_id
  WHERE cm.id = module_assessments.module_id 
  AND c.status = 'published'
));

-- Add assessment completion tracking to student_progress
ALTER TABLE public.student_progress 
ADD COLUMN assessment_completed BOOLEAN DEFAULT false,
ADD COLUMN assessment_score INTEGER DEFAULT NULL,
ADD COLUMN assessment_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create trigger for updated_at on module_assessments
CREATE TRIGGER update_module_assessments_updated_at
BEFORE UPDATE ON public.module_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user can progress to next module
CREATE OR REPLACE FUNCTION public.can_progress_to_module(
  current_module_id UUID,
  user_id_param UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_position INTEGER;
  course_id_param UUID;
  previous_module_id UUID;
  has_required_assessment BOOLEAN;
  assessment_completed BOOLEAN := false;
BEGIN
  -- Get current module position and course
  SELECT position, course_id INTO current_position, course_id_param
  FROM course_modules 
  WHERE id = current_module_id;
  
  -- If this is the first module, allow access
  IF current_position <= 1 THEN
    RETURN true;
  END IF;
  
  -- Get previous module
  SELECT id INTO previous_module_id
  FROM course_modules 
  WHERE course_id = course_id_param 
  AND position = current_position - 1;
  
  -- Check if previous module has required assessment
  SELECT EXISTS(
    SELECT 1 FROM module_assessments 
    WHERE module_id = previous_module_id 
    AND is_required = true
  ) INTO has_required_assessment;
  
  -- If no required assessment, allow progression
  IF NOT has_required_assessment THEN
    RETURN true;
  END IF;
  
  -- Check if user completed the required assessment
  SELECT EXISTS(
    SELECT 1 FROM student_progress sp
    WHERE sp.lesson_id IN (
      SELECT cl.id FROM course_lessons cl 
      WHERE cl.module_id = previous_module_id
    )
    AND (sp.user_id = user_id_param OR sp.student_id IN (
      SELECT s.id FROM students s WHERE s.email = (
        SELECT email FROM auth.users WHERE id = user_id_param
      )
    ))
    AND sp.assessment_completed = true
  ) INTO assessment_completed;
  
  RETURN assessment_completed;
END;
$$;