-- Drop the incorrect FK constraint that points to 'lessons' table
ALTER TABLE cleo_lesson_plans
DROP CONSTRAINT cleo_lesson_plans_lesson_id_fkey;

-- Add the correct FK constraint pointing to 'course_lessons' table
ALTER TABLE cleo_lesson_plans
ADD CONSTRAINT cleo_lesson_plans_lesson_id_fkey
FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE SET NULL;

-- Backfill lesson_id by matching topic to lesson title
UPDATE cleo_lesson_plans clp
SET lesson_id = (
  SELECT cl.id
  FROM course_lessons cl
  WHERE LOWER(cl.title) = LOWER(clp.topic)
  LIMIT 1
)
WHERE clp.lesson_id IS NULL;

-- Set exam_board from course's default exam board specification
UPDATE cleo_lesson_plans clp
SET exam_board = (
  SELECT ebs.exam_board
  FROM course_lessons cl
  JOIN course_modules cm ON cl.module_id = cm.id
  JOIN course_exam_board_specifications cebs ON cebs.course_id = cm.course_id AND cebs.is_default = true
  JOIN exam_board_specifications ebs ON ebs.id = cebs.exam_board_specification_id
  WHERE cl.id = clp.lesson_id
  LIMIT 1
)
WHERE clp.lesson_id IS NOT NULL AND clp.exam_board IS NULL;