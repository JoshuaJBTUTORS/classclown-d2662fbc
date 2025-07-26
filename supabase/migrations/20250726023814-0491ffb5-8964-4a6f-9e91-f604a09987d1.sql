-- Fix the foreign key constraint for lesson_student_summaries
-- First drop the RLS policies that depend on student_id column
DROP POLICY IF EXISTS "Users can view summaries for accessible lessons" ON lesson_student_summaries;
DROP POLICY IF EXISTS "Admins and tutors can manage summaries" ON lesson_student_summaries;

-- Drop the existing foreign key constraint if it exists
ALTER TABLE lesson_student_summaries 
DROP CONSTRAINT IF EXISTS lesson_student_summaries_student_id_fkey;

-- Change student_id column type to match students table
ALTER TABLE lesson_student_summaries 
ALTER COLUMN student_id TYPE bigint;

-- Add the proper foreign key constraint
ALTER TABLE lesson_student_summaries 
ADD CONSTRAINT lesson_student_summaries_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Recreate the RLS policies
CREATE POLICY "Admins and tutors can manage summaries" 
ON lesson_student_summaries FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_student_summaries.lesson_id
    AND (
      ur.role IN ('admin', 'owner')
      OR (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
    )
  )
);

CREATE POLICY "Users can view summaries for accessible lessons" 
ON lesson_student_summaries FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN user_roles ur ON ur.user_id = auth.uid()
    WHERE l.id = lesson_student_summaries.lesson_id
    AND (
      ur.role IN ('admin', 'owner')
      OR (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
      OR (
        ur.role IN ('student', 'parent') 
        AND (
          lesson_student_summaries.student_id = get_current_user_student_id()
          OR lesson_student_summaries.student_id IN (
            SELECT s.id FROM students s 
            WHERE s.parent_id = get_current_user_parent_id()
          )
        )
      )
    )
  )
);