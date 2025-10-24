-- Add subject field to lesson_times JSONB for existing proposals
-- This migration updates existing lesson_proposals to include a subject field in each lesson_time entry
-- Using the proposal's top-level subject as the default value

UPDATE lesson_proposals
SET lesson_times = (
  SELECT jsonb_agg(
    jsonb_set(
      lesson_time,
      '{subject}',
      to_jsonb(lesson_proposals.subject)
    )
  )
  FROM jsonb_array_elements(lesson_times) AS lesson_time
)
WHERE lesson_times IS NOT NULL 
  AND lesson_times != '[]'::jsonb
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(lesson_times) AS lt
    WHERE lt ? 'subject'
  );