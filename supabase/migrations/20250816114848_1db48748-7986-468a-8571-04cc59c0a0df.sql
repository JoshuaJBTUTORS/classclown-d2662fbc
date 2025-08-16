-- Fix duplicate transcript records and prevent future duplicates

-- First, identify and remove duplicate transcript records, keeping the most recent one
WITH duplicate_transcripts AS (
  SELECT lesson_id, 
         array_agg(id ORDER BY created_at DESC) as transcript_ids
  FROM lesson_transcriptions 
  GROUP BY lesson_id 
  HAVING COUNT(*) > 1
),
transcripts_to_delete AS (
  SELECT unnest(transcript_ids[2:]) as id_to_delete
  FROM duplicate_transcripts
)
DELETE FROM lesson_transcriptions 
WHERE id IN (SELECT id_to_delete FROM transcripts_to_delete);

-- Add unique constraint to prevent future duplicates
ALTER TABLE lesson_transcriptions 
ADD CONSTRAINT lesson_transcriptions_lesson_id_unique UNIQUE (lesson_id);