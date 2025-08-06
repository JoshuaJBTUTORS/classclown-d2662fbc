-- Focus on first lesson only (July 2nd Algebra Fundamentals)
-- Update the specific lesson with video recording info
UPDATE lessons 
SET 
  lesson_space_session_id = 'ls_session_july2_algebra_001',
  lesson_space_recording_url = 'https://recordings.lessonspace.com/july2_algebra_fundamentals_2024.mp4'
WHERE id = 'd1234567-89ab-cdef-0123-456789abcdef';

-- Insert transcription record for this lesson
INSERT INTO lesson_transcriptions (
  id,
  lesson_id,
  transcription_text,
  status,
  lessonspace_transcription_id,
  transcription_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd1234567-89ab-cdef-0123-456789abcdef',
  'Teacher: Today we''ll cover linear equations and solving for x. Emily, can you tell me what x equals in 2x + 5 = 15? Emily: I think x equals 5. Teacher: Exactly right! James, can you show us how Emily got that answer? James: First subtract 5 from both sides to get 2x = 10, then divide by 2 to get x = 5. Teacher: Perfect explanation James! Now let''s try a harder problem...',
  'completed',
  'transcription_july2_algebra_001',
  'https://transcriptions.lessonspace.com/july2_algebra_fundamentals.txt',
  '2024-07-02 11:15:00+00',
  '2024-07-02 11:15:00+00'
);

-- Insert lesson summaries for Emily Chen (student_id: 1)
INSERT INTO lesson_student_summaries (
  id,
  lesson_id,
  student_id,
  ai_summary,
  topics_covered,
  engagement_score,
  confidence_score,
  contributions,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd1234567-89ab-cdef-0123-456789abcdef',
  1,
  'Emily demonstrated strong understanding of linear equations today. She correctly solved 2x + 5 = 15 without hesitation and showed good algebraic reasoning. Her confidence appears high when working with basic equation solving.',
  ARRAY['Linear equations', 'Solving for variables', 'Basic algebra'],
  85,
  90,
  'Correctly solved 2x + 5 = 15, actively participated in discussions, asked clarifying questions about more complex problems',
  '2024-07-02 11:30:00+00',
  '2024-07-02 11:30:00+00'
);

-- Insert lesson summaries for James Wilson (student_id: 2)
INSERT INTO lesson_student_summaries (
  id,
  lesson_id,
  student_id,
  ai_summary,
  topics_covered,
  engagement_score,
  confidence_score,
  contributions,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'd1234567-89ab-cdef-0123-456789abcdef',
  2,
  'James showed excellent analytical skills by clearly explaining the step-by-step process for solving linear equations. His ability to break down the solution method demonstrates strong mathematical communication skills and deep understanding.',
  ARRAY['Linear equations', 'Step-by-step problem solving', 'Mathematical explanation'],
  92,
  88,
  'Provided detailed explanation of solution process, helped clarify concepts for other students, showed strong analytical thinking',
  '2024-07-02 11:30:00+00',
  '2024-07-02 11:30:00+00'
);

-- Update student progress to ensure lesson appears in summaries
INSERT INTO student_progress (
  lesson_id,
  student_id,
  status,
  engagement_score,
  confidence_level,
  notes,
  created_at,
  updated_at
) VALUES 
(
  'd1234567-89ab-cdef-0123-456789abcdef',
  1,
  'completed',
  85,
  90,
  'Strong performance in algebra fundamentals',
  '2024-07-02 11:00:00+00',
  '2024-07-02 11:30:00+00'
),
(
  'd1234567-89ab-cdef-0123-456789abcdef',
  2,
  'completed',
  92,
  88,
  'Excellent explanation skills demonstrated',
  '2024-07-02 11:00:00+00',
  '2024-07-02 11:30:00+00'
)
ON CONFLICT (lesson_id, student_id) DO UPDATE SET
  status = EXCLUDED.status,
  engagement_score = EXCLUDED.engagement_score,
  confidence_level = EXCLUDED.confidence_level,
  notes = EXCLUDED.notes,
  updated_at = EXCLUDED.updated_at;