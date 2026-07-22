ALTER TABLE public.lesson_student_summaries
  ADD COLUMN IF NOT EXISTS homework_brief jsonb;