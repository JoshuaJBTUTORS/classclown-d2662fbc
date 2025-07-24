-- Fix the RLS disabled issues by enabling RLS on tables that need it
-- These are existing tables that should have RLS enabled

-- Enable RLS on tables if not already enabled
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Add basic policies for quiz tables to secure them
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (student_id IN (
    SELECT id FROM public.students WHERE email = auth.email()
  ));

CREATE POLICY "Users can create their own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (student_id IN (
    SELECT id FROM public.students WHERE email = auth.email()
  ));

CREATE POLICY "Users can view quiz questions for accessible lessons" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_lessons cl
      JOIN public.course_modules cm ON cl.module_id = cm.id
      JOIN public.courses c ON cm.course_id = c.id
      WHERE cl.id = quiz_questions.lesson_id
      AND c.status = 'published'
    )
  );

CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'tutor')
    )
  );

CREATE POLICY "Users can view quiz options for accessible questions" ON public.quiz_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions qq
      JOIN public.course_lessons cl ON qq.lesson_id = cl.id
      JOIN public.course_modules cm ON cl.module_id = cm.id
      JOIN public.courses c ON cm.course_id = c.id
      WHERE qq.id = quiz_options.question_id
      AND c.status = 'published'
    )
  );

CREATE POLICY "Admins can manage quiz options" ON public.quiz_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner', 'tutor')
    )
  );