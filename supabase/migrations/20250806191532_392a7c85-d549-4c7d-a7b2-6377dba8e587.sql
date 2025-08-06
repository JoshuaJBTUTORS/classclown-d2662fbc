-- Use an existing lesson for testing lesson summaries
-- Update the A-level Physics lesson with video recording info
UPDATE lessons 
SET 
  lesson_space_session_id = 'ls_session_july2_algebra_001',
  lesson_space_recording_url = 'https://recordings.lessonspace.com/july2_algebra_fundamentals_2024.mp4'
WHERE id = '85ad382d-ac30-4d28-ae98-1ad981c3add4';

-- Insert transcription record for this lesson
INSERT INTO lesson_transcriptions (
  id,
  lesson_id,
  session_id,
  transcription_text,
  transcription_status,
  transcription_url,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '85ad382d-ac30-4d28-ae98-1ad981c3add4',
  'ls_session_july2_algebra_001',
  'Teacher: Today we''ll cover linear equations and solving for x. Emily, can you tell me what x equals in 2x + 5 = 15? Emily: I think x equals 5. Teacher: Exactly right! James, can you show us how Emily got that answer? James: First subtract 5 from both sides to get 2x = 10, then divide by 2 to get x = 5. Teacher: Perfect explanation James! Now let''s try a harder problem...',
  'completed',
  'https://transcriptions.lessonspace.com/july2_algebra_fundamentals.txt',
  '2024-07-02 11:15:00+00',
  '2024-07-02 11:15:00+00'
);

-- Get the transcription ID and insert summaries
DO $$
DECLARE
    transcription_uuid uuid;
BEGIN
    SELECT id INTO transcription_uuid 
    FROM lesson_transcriptions 
    WHERE lesson_id = '85ad382d-ac30-4d28-ae98-1ad981c3add4' 
    LIMIT 1;

    -- Insert lesson summaries for Emily Chen (student_id: 1) - using 0-10 scale
    INSERT INTO lesson_student_summaries (
      id,
      lesson_id,
      student_id,
      transcription_id,
      ai_summary,
      topics_covered,
      engagement_score,
      confidence_score,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '85ad382d-ac30-4d28-ae98-1ad981c3add4',
      1,
      transcription_uuid,
      'Emily demonstrated strong understanding of linear equations today. She correctly solved 2x + 5 = 15 without hesitation and showed good algebraic reasoning. Her confidence appears high when working with basic equation solving.',
      ARRAY['Linear equations', 'Solving for variables', 'Basic algebra'],
      8,
      9,
      '2024-07-02 11:30:00+00',
      '2024-07-02 11:30:00+00'
    );

    -- Insert lesson summaries for James Wilson (student_id: 2) - using 0-10 scale 
    INSERT INTO lesson_student_summaries (
      id,
      lesson_id,
      student_id,
      transcription_id,
      ai_summary,
      topics_covered,
      engagement_score,
      confidence_score,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '85ad382d-ac30-4d28-ae98-1ad981c3add4',
      2,
      transcription_uuid,
      'James showed excellent analytical skills by clearly explaining the step-by-step process for solving linear equations. His ability to break down the solution method demonstrates strong mathematical communication skills and deep understanding.',
      ARRAY['Linear equations', 'Step-by-step problem solving', 'Mathematical explanation'],
      9,
      8,
      '2024-07-02 11:30:00+00',
      '2024-07-02 11:30:00+00'
    );
END $$;

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
  '85ad382d-ac30-4d28-ae98-1ad981c3add4',
  1,
  'completed',
  8,
  9,
  'Strong performance in algebra fundamentals',
  '2024-07-02 11:00:00+00',
  '2024-07-02 11:30:00+00'
),
(
  '85ad382d-ac30-4d28-ae98-1ad981c3add4',
  2,
  'completed',
  9,
  8,
  'Excellent explanation skills demonstrated',
  '2024-07-02 11:00:00+00',
  '2024-07-02 11:30:00+00'
);