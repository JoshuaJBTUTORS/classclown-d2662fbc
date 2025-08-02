-- Add unique constraint to lesson_transcriptions table
-- This will allow the upsert operation with onConflict: 'lesson_id,session_id' to work properly
ALTER TABLE public.lesson_transcriptions 
ADD CONSTRAINT lesson_transcriptions_lesson_session_unique 
UNIQUE (lesson_id, session_id);