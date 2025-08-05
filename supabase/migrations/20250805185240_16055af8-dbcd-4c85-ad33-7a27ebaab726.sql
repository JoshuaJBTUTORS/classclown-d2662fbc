-- Clean up all existing demo data permanently
-- This will ensure demo lessons stop reappearing

-- Delete lesson attendance for demo lessons
DELETE FROM lesson_attendance 
WHERE lesson_id IN (
  SELECT id FROM lessons WHERE is_demo_data = true
);

-- Delete lesson student associations for demo lessons  
DELETE FROM lesson_students 
WHERE lesson_id IN (
  SELECT id FROM lessons WHERE is_demo_data = true
);

-- Delete homework submissions for demo homework
DELETE FROM homework_submissions 
WHERE homework_id IN (
  SELECT id FROM homework WHERE is_demo_data = true
);

-- Delete demo homework
DELETE FROM homework WHERE is_demo_data = true;

-- Delete lesson transcriptions for demo lessons
DELETE FROM lesson_transcriptions 
WHERE lesson_id IN (
  SELECT id FROM lessons WHERE is_demo_data = true
);

-- Delete lesson summaries for demo lessons
DELETE FROM lesson_student_summaries 
WHERE lesson_id IN (
  SELECT id FROM lessons WHERE is_demo_data = true
);

-- Delete lesson participant URLs for demo lessons
DELETE FROM lesson_participant_urls 
WHERE lesson_id IN (
  SELECT id FROM lessons WHERE is_demo_data = true
);

-- Delete lesson plan assignments for demo lessons
DELETE FROM lesson_plan_assignments 
WHERE lesson_id IN (
  SELECT id FROM lessons WHERE is_demo_data = true
);

-- Delete all demo sessions
DELETE FROM demo_sessions;

-- Delete demo lessons (main table)
DELETE FROM lessons WHERE is_demo_data = true;

-- Delete demo students
DELETE FROM students WHERE is_demo_data = true;

-- Delete demo parents  
DELETE FROM parents WHERE is_demo_data = true;

-- Delete demo tutors
DELETE FROM tutors WHERE is_demo_data = true;

-- Delete demo courses if they exist
DELETE FROM courses WHERE is_demo_data = true;