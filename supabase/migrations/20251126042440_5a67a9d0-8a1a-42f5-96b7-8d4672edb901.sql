-- Drop the old single-column constraint that only allows one plan per lesson
DROP INDEX IF EXISTS idx_unique_lesson_plan;

-- Create new composite constraint allowing:
-- - Different exam boards for same lesson
-- - Different difficulty tiers for same lesson
-- - One plan per (lesson_id + exam_board + difficulty_tier) combination
CREATE UNIQUE INDEX idx_unique_lesson_plan 
ON public.cleo_lesson_plans (lesson_id, exam_board, difficulty_tier) 
WHERE (lesson_id IS NOT NULL);