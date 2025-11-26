-- Add difficulty_tier column to cleo_lesson_plans
ALTER TABLE cleo_lesson_plans 
ADD COLUMN difficulty_tier TEXT 
CHECK (difficulty_tier IN ('foundation', 'intermediate', 'higher'));

-- Add preferred_difficulty to profiles (optional, for remembering user preference)
ALTER TABLE profiles 
ADD COLUMN preferred_difficulty TEXT DEFAULT 'intermediate'
CHECK (preferred_difficulty IN ('foundation', 'intermediate', 'higher'));

-- Create index for efficient lookups
CREATE INDEX idx_lesson_plans_difficulty ON cleo_lesson_plans(lesson_id, exam_board, difficulty_tier);