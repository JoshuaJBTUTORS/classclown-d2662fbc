-- Create table to store Launch API URLs for all lesson participants
CREATE TABLE public.lesson_participant_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL, -- Can be tutor ID or student ID
  participant_type TEXT NOT NULL CHECK (participant_type IN ('tutor', 'student')),
  participant_name TEXT NOT NULL,
  launch_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, participant_id, participant_type)
);

-- Enable RLS
ALTER TABLE public.lesson_participant_urls ENABLE ROW LEVEL SECURITY;

-- Create policies for lesson participant URLs
CREATE POLICY "Users can view participant URLs for accessible lessons" 
ON public.lesson_participant_urls 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_participant_urls.lesson_id
    AND (
      -- Admin/Owner can see all
      ur.role IN ('admin', 'owner')
      OR 
      -- Tutor can see their own lessons
      (ur.role = 'tutor' AND l.tutor_id = public.get_current_user_tutor_id())
      OR
      -- Student/Parent can see lessons they're enrolled in
      (ur.role IN ('student', 'parent') AND EXISTS (
        SELECT 1 FROM public.lesson_students ls
        WHERE ls.lesson_id = l.id
        AND (
          ls.student_id = public.get_current_user_student_id()
          OR 
          ls.student_id IN (
            SELECT s.id FROM public.students s 
            WHERE s.parent_id = public.get_current_user_parent_id()
          )
        )
      ))
    )
  )
);

CREATE POLICY "System can manage participant URLs" 
ON public.lesson_participant_urls 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lesson_participant_urls_updated_at
BEFORE UPDATE ON public.lesson_participant_urls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_lesson_participant_urls_lesson_id ON public.lesson_participant_urls(lesson_id);
CREATE INDEX idx_lesson_participant_urls_participant ON public.lesson_participant_urls(participant_id, participant_type);