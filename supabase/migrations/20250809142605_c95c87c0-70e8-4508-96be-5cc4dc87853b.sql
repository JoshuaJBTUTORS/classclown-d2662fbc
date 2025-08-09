
-- Add unique constraint to lesson_participant_urls for proper upsert functionality
ALTER TABLE public.lesson_participant_urls 
ADD CONSTRAINT lesson_participant_urls_unique_participant 
UNIQUE (lesson_id, participant_id, participant_type);

-- Add index to improve lookup performance
CREATE INDEX IF NOT EXISTS idx_lesson_participant_urls_lookup 
ON public.lesson_participant_urls (lesson_id, participant_type);
