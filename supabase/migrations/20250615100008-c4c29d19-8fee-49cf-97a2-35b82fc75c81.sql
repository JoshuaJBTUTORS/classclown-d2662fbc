
-- The previous attempt failed due to an incorrect user ID.
-- This new plan uses the correct user ID for the currently authenticated user and is safe to re-run.

-- Step 1: Update existing assessment scores for your GCSE Biology modules
UPDATE public.assessment_sessions
SET total_marks_achieved = 27
WHERE id = '1a1d6360-153b-4c07-ae6d-1510e1495c02';

UPDATE public.assessment_sessions
SET total_marks_achieved = 42
WHERE id = '69850116-3e0f-4e0d-b286-9ef016834b10';

UPDATE public.assessment_sessions
SET total_marks_achieved = 37
WHERE id = 'a93b2a26-a05d-4f11-9257-897d956f2f25';


-- Step 2: Create new placeholder assessments for the missing modules
-- Using ON CONFLICT to avoid errors if they were partially created. The user ID is now correct.
INSERT INTO public.ai_assessments (id, title, subject, status, created_by) VALUES
('0f9b3b1e-1b3a-4f5c-8a1a-4a6f8b9c0d1e', 'Assessment - Bioenergetics', 'GCSE Biology', 'published', '8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4'),
('1f9b3b1e-1b3a-4f5c-8a1a-4a6f8b9c0d1e', 'Assessment - Homeostasis and Response', 'GCSE Biology', 'published', '8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4'),
('2f9b3b1e-1b3a-4f5c-8a1a-4a6f8b9c0d1e', 'Assessment - Inheritance, Variation and Evolution', 'GCSE Biology', 'published', '8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4')
ON CONFLICT (id) DO NOTHING;


-- Step 3: Insert or update fictional assessment scores for the newly created assessments.
INSERT INTO public.assessment_sessions (id, user_id, assessment_id, total_marks_achieved, total_marks_available, status, completed_at, started_at)
VALUES
('3a1d6360-153b-4c07-ae6d-1510e1495c03', '8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4', '0f9b3b1e-1b3a-4f5c-8a1a-4a6f8b9c0d1e', 16, 40, 'completed', NOW() - interval '3 day', NOW() - interval '3 day' - interval '30 minutes'),
('49850116-3e0f-4e0d-b286-9ef016834b11', '8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4', '1f9b3b1e-1b3a-4f5c-8a1a-4a6f8b9c0d1e', 33, 65, 'completed', NOW() - interval '2 day', NOW() - interval '2 day' - interval '45 minutes'),
('593b2a26-a05d-4f11-9257-897d956f2f26', '8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4', '2f9b3b1e-1b3a-4f5c-8a1a-4a6f8b9c0d1e', 45, 70, 'completed', NOW() - interval '1 day', NOW() - interval '1 day' - interval '50 minutes')
ON CONFLICT(id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  assessment_id = EXCLUDED.assessment_id,
  total_marks_achieved = EXCLUDED.total_marks_achieved,
  total_marks_available = EXCLUDED.total_marks_available,
  status = EXCLUDED.status,
  completed_at = EXCLUDED.completed_at,
  started_at = EXCLUDED.started_at;
