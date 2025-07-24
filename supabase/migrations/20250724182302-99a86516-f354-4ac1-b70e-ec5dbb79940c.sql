-- Add user_id column to student_progress table for Learning Hub users
ALTER TABLE public.student_progress 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add constraint to ensure either student_id OR user_id is present (not both)
ALTER TABLE public.student_progress 
ADD CONSTRAINT student_progress_user_constraint 
CHECK (
  (student_id IS NOT NULL AND user_id IS NULL) OR 
  (student_id IS NULL AND user_id IS NOT NULL)
);

-- Update RLS policies to support both access patterns
DROP POLICY IF EXISTS "Users can create their own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can insert their own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can update their own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can view their own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can delete their own progress" ON public.student_progress;

-- Create new RLS policies for both student and user access
CREATE POLICY "Users can insert their own progress" ON public.student_progress
FOR INSERT WITH CHECK (
  (user_id = auth.uid()) OR 
  (student_id IN (SELECT id FROM students WHERE email = auth.email()))
);

CREATE POLICY "Users can update their own progress" ON public.student_progress
FOR UPDATE USING (
  (user_id = auth.uid()) OR 
  (student_id IN (SELECT id FROM students WHERE email = auth.email()))
);

CREATE POLICY "Users can view their own progress" ON public.student_progress
FOR SELECT USING (
  (user_id = auth.uid()) OR 
  (student_id IN (SELECT id FROM students WHERE email = auth.email()))
);

CREATE POLICY "Users can delete their own progress" ON public.student_progress
FOR DELETE USING (
  (user_id = auth.uid()) OR 
  (student_id IN (SELECT id FROM students WHERE email = auth.email()))
);