
-- Create table to track whiteboard files with automatic cleanup
CREATE TABLE public.whiteboard_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'document')),
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient cleanup queries
CREATE INDEX idx_whiteboard_files_expires_at ON public.whiteboard_files(expires_at);
CREATE INDEX idx_whiteboard_files_lesson_id ON public.whiteboard_files(lesson_id);

-- Enable Row Level Security
ALTER TABLE public.whiteboard_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view whiteboard files for their lessons" 
  ON public.whiteboard_files 
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

CREATE POLICY "Tutors can upload whiteboard files for their lessons" 
  ON public.whiteboard_files 
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

CREATE POLICY "Users can delete whiteboard files for their lessons" 
  ON public.whiteboard_files 
  FOR DELETE 
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

-- Enable pg_cron extension for automated cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
