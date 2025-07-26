-- Fix the foreign key constraint for lesson_student_summaries
-- The students table uses bigint, but we're referencing it as integer

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

-- Also update lesson_attendance table to match (if it has similar issue)
ALTER TABLE lesson_attendance 
DROP CONSTRAINT IF EXISTS lesson_attendance_student_id_fkey;

ALTER TABLE lesson_attendance 
ALTER COLUMN student_id TYPE bigint;

ALTER TABLE lesson_attendance 
ADD CONSTRAINT lesson_attendance_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;