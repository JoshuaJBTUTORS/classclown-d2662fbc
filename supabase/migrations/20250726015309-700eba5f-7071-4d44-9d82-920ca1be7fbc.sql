-- Add session_id to lessons table for transcription tracking
ALTER TABLE public.lessons 
ADD COLUMN lesson_space_session_id TEXT;

-- Create table for storing lesson transcriptions
CREATE TABLE public.lesson_transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  transcription_url TEXT,
  transcription_text TEXT,
  transcription_status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create table for storing AI-generated student summaries
CREATE TABLE public.lesson_student_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  student_id INTEGER NOT NULL,
  transcription_id UUID NOT NULL,
  topics_covered TEXT[],
  student_contributions TEXT,
  what_went_well TEXT,
  areas_for_improvement TEXT,
  engagement_level TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lesson_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_student_summaries ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_transcriptions
CREATE POLICY "Users can view transcriptions for accessible lessons" 
ON public.lesson_transcriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_transcriptions.lesson_id
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

CREATE POLICY "Admins and tutors can manage transcriptions" 
ON public.lesson_transcriptions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_transcriptions.lesson_id
    AND (
      ur.role IN ('admin', 'owner')
      OR (ur.role = 'tutor' AND l.tutor_id = public.get_current_user_tutor_id())
    )
  )
);

-- RLS policies for lesson_student_summaries  
CREATE POLICY "Users can view summaries for accessible lessons" 
ON public.lesson_student_summaries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_student_summaries.lesson_id
    AND (
      -- Admin/Owner can see all
      ur.role IN ('admin', 'owner')
      OR 
      -- Tutor can see their own lessons
      (ur.role = 'tutor' AND l.tutor_id = public.get_current_user_tutor_id())
      OR
      -- Student/Parent can see their own summaries
      (ur.role IN ('student', 'parent') AND (
        lesson_student_summaries.student_id = public.get_current_user_student_id()
        OR 
        lesson_student_summaries.student_id IN (
          SELECT s.id FROM public.students s 
          WHERE s.parent_id = public.get_current_user_parent_id()
        )
      ))
    )
  )
);

CREATE POLICY "Admins and tutors can manage summaries" 
ON public.lesson_student_summaries 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_student_summaries.lesson_id
    AND (
      ur.role IN ('admin', 'owner')
      OR (ur.role = 'tutor' AND l.tutor_id = public.get_current_user_tutor_id())
    )
  )
);

-- Add foreign key constraints
ALTER TABLE public.lesson_transcriptions 
ADD CONSTRAINT fk_lesson_transcriptions_lesson_id 
FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_student_summaries 
ADD CONSTRAINT fk_lesson_student_summaries_lesson_id 
FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_student_summaries 
ADD CONSTRAINT fk_lesson_student_summaries_transcription_id 
FOREIGN KEY (transcription_id) REFERENCES public.lesson_transcriptions(id) ON DELETE CASCADE;

ALTER TABLE public.lesson_student_summaries 
ADD CONSTRAINT fk_lesson_student_summaries_student_id 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_lesson_transcriptions_lesson_id ON public.lesson_transcriptions(lesson_id);
CREATE INDEX idx_lesson_transcriptions_session_id ON public.lesson_transcriptions(session_id);
CREATE INDEX idx_lesson_student_summaries_lesson_id ON public.lesson_student_summaries(lesson_id);
CREATE INDEX idx_lesson_student_summaries_student_id ON public.lesson_student_summaries(student_id);

-- Add trigger for updated_at timestamps
CREATE TRIGGER update_lesson_transcriptions_updated_at
BEFORE UPDATE ON public.lesson_transcriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_student_summaries_updated_at
BEFORE UPDATE ON public.lesson_student_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();