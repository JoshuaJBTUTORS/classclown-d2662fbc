
-- Create table to track document conversions
CREATE TABLE public.document_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  task_uuid TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Converting',
  conversion_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for efficient queries
CREATE INDEX idx_document_conversions_lesson_id ON public.document_conversions(lesson_id);
CREATE INDEX idx_document_conversions_task_uuid ON public.document_conversions(task_uuid);
CREATE INDEX idx_document_conversions_status ON public.document_conversions(status);

-- Enable Row Level Security
ALTER TABLE public.document_conversions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view conversions for their lessons" 
  ON public.document_conversions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE l.id = lesson_id
      AND (
        ur.role IN ('admin', 'owner')
        OR (ur.role = 'tutor' AND l.tutor_id = public.get_current_user_tutor_id())
        OR (ur.role IN ('student', 'parent') AND EXISTS (
          SELECT 1 FROM public.lesson_students ls
          WHERE ls.lesson_id = l.id
          AND (
            ls.student_id = public.get_current_user_student_id()
            OR ls.student_id IN (
              SELECT s.id FROM public.students s 
              WHERE s.parent_id = public.get_current_user_parent_id()
            )
          )
        ))
      )
    )
  );

CREATE POLICY "Tutors can create conversions for their lessons" 
  ON public.document_conversions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE l.id = lesson_id
      AND ur.role = 'tutor'
      AND l.tutor_id = public.get_current_user_tutor_id()
    )
  );

CREATE POLICY "Users can update conversions for their lessons" 
  ON public.document_conversions 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE l.id = lesson_id
      AND (
        ur.role IN ('admin', 'owner')
        OR (ur.role = 'tutor' AND l.tutor_id = public.get_current_user_tutor_id())
      )
    )
  );
