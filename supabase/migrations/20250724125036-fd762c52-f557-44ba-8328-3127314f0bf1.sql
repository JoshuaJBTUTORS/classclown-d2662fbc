-- Add the missing grade column to students table
ALTER TABLE public.students ADD COLUMN grade TEXT;

-- Add an index for performance on the grade column
CREATE INDEX IF NOT EXISTS idx_students_grade ON public.students(grade);