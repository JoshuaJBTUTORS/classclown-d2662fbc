-- Reset learning journey for ben@test.com - clean up completed lessons
-- Keep only getting started module accessible by resetting all course progress

-- Reset all lesson completion status for this user
UPDATE student_progress 
SET 
  status = 'not_started',
  completion_percentage = 0,
  completed_at = NULL,
  path_status = 'locked',
  assessment_completed = false,
  assessment_score = NULL,
  assessment_completed_at = NULL
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Unlock only the first module (Getting Started) by setting it to available
-- We'll need to identify the first module and unlock just that one
UPDATE student_progress 
SET path_status = 'available'
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
AND lesson_id IN (
  SELECT cl.id 
  FROM course_lessons cl
  JOIN course_modules cm ON cl.module_id = cm.id
  WHERE cm.position = 1
  AND cm.course_id = '31084174-d6ff-4a3e-b670-cca6256a7f31'
);