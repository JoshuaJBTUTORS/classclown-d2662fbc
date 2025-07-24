-- Add learning path related fields to courses table
ALTER TABLE public.courses ADD COLUMN path_position INTEGER DEFAULT 0;
ALTER TABLE public.courses ADD COLUMN prerequisites JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.courses ADD COLUMN unlock_requirements JSONB DEFAULT '{}'::jsonb;

-- Add path status fields to student_progress table
ALTER TABLE public.student_progress ADD COLUMN path_status TEXT DEFAULT 'locked';
ALTER TABLE public.student_progress ADD COLUMN unlocked_at TIMESTAMP WITH TIME ZONE;

-- Create learning_paths table for managing different path configurations
CREATE TABLE public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Default Learning Path',
  description TEXT,
  theme TEXT DEFAULT 'desert',
  path_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on learning_paths
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- Create policies for learning_paths
CREATE POLICY "Admins can manage learning paths" ON public.learning_paths
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Everyone can view active learning paths" ON public.learning_paths
  FOR SELECT USING (is_active = true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_path_position ON public.courses(path_position);
CREATE INDEX IF NOT EXISTS idx_student_progress_path_status ON public.student_progress(path_status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_active ON public.learning_paths(is_active);

-- Insert default learning path
INSERT INTO public.learning_paths (name, description, theme, path_config) 
VALUES (
  'Main Learning Journey', 
  'The primary learning path for all courses', 
  'desert',
  '{"pathType": "spiral", "spacing": 120, "curvature": 0.3}'::jsonb
);

-- Update existing courses with basic path positions (spread them out)
UPDATE public.courses 
SET path_position = (
  SELECT row_number FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
    FROM public.courses
  ) numbered 
  WHERE numbered.id = courses.id
) * 100
WHERE path_position = 0;