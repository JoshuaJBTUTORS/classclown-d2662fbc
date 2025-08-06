-- Add lesson_id column to ai_assessments table to link assessments back to originating lessons
ALTER TABLE public.ai_assessments 
ADD COLUMN lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL;