-- Add exam_board and subject_name columns to cleo_lesson_plans
ALTER TABLE cleo_lesson_plans ADD COLUMN IF NOT EXISTS exam_board TEXT;
ALTER TABLE cleo_lesson_plans ADD COLUMN IF NOT EXISTS subject_name TEXT;

-- Create index for efficient lookup by lesson_id and exam_board
CREATE INDEX IF NOT EXISTS idx_cleo_lesson_plans_lesson_exam_board 
ON cleo_lesson_plans(lesson_id, exam_board) 
WHERE lesson_id IS NOT NULL AND exam_board IS NOT NULL;

-- Create index for subject_name lookups
CREATE INDEX IF NOT EXISTS idx_cleo_lesson_plans_subject_name 
ON cleo_lesson_plans(subject_name) 
WHERE subject_name IS NOT NULL;