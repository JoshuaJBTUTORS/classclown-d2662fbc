
-- Add lesson_id column
ALTER TABLE public.homework_completion_status ADD COLUMN lesson_id text;

-- Make homework_id nullable
ALTER TABLE public.homework_completion_status ALTER COLUMN homework_id DROP NOT NULL;

-- Drop old unique constraint
ALTER TABLE public.homework_completion_status DROP CONSTRAINT IF EXISTS homework_completion_status_homework_id_student_id_key;

-- Add new unique constraint on lesson_id + student_id
ALTER TABLE public.homework_completion_status ADD CONSTRAINT homework_completion_status_lesson_id_student_id_key UNIQUE (lesson_id, student_id);
