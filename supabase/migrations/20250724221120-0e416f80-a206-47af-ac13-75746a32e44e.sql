-- Clean up assessment-related data for ben@test.com (user_id: 7e8b7c9f-b80b-40e4-890d-97a4239c9aef)
-- First, delete student responses linked to this user's sessions
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

-- Delete student progress records
DELETE FROM student_progress 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Delete revision schedules and related data
DELETE FROM revision_progress 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

DELETE FROM revision_sessions 
WHERE schedule_id IN (
  SELECT id FROM revision_schedules 
  WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef'
);

DELETE FROM revision_schedules 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';

-- Delete course notes
DELETE FROM course_notes 
WHERE user_id = '7e8b7c9f-b80b-40e4-890d-97a4239c9aef';