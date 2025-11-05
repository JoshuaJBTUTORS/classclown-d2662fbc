-- Make lesson_id nullable since Cleo lesson plans can be standalone
ALTER TABLE public.cleo_lesson_plans 
  ALTER COLUMN lesson_id DROP NOT NULL;