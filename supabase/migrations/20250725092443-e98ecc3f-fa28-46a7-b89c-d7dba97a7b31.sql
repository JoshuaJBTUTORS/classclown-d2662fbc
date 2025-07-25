
-- Reset all learning hub data for ben@test.com while preserving course access
-- User ID: 7e8b7c9f-b80b-40e4-890d-97a4239c9aef

-- Delete student responses (must be done before assessment sessions due to foreign key)
DELETE FROM student_responses 
WHERE session_id IN (
  SELECT id FROM assessment_sessions 
  WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
);

-- Delete assessment sessions
DELETE FROM assessment_sessions 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Delete assessment improvements
DELETE FROM assessment_improvements 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Delete student progress
DELETE FROM student_progress 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Delete course notes (if any)
DELETE FROM course_notes 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Delete revision schedules and sessions (if any)
DELETE FROM revision_sessions 
WHERE schedule_id IN (
  SELECT id FROM revision_schedules 
  WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
);

DELETE FROM revision_schedules 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Delete revision progress (if any)
DELETE FROM revision_progress 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Keep course purchases intact so ben still has access to the courses
-- The course_purchases table will remain untouched

-- Verify the cleanup by checking remaining data
SELECT 'Assessment Sessions' as table_name, COUNT(*) as remaining_count
FROM assessment_sessions WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
UNION ALL
SELECT 'Student Responses', COUNT(*) 
FROM student_responses WHERE session_id IN (
  SELECT id FROM assessment_sessions WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
)
UNION ALL
SELECT 'Student Progress', COUNT(*) 
FROM student_progress WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
UNION ALL
SELECT 'Assessment Improvements', COUNT(*) 
FROM assessment_improvements WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
UNION ALL
SELECT 'Course Purchases', COUNT(*) 
FROM course_purchases WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
UNION ALL
SELECT 'Course Notes', COUNT(*) 
FROM course_notes WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';
