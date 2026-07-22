
UPDATE public.lessons
SET lesson_space_session_id = NULL
WHERE lesson_space_session_id IS NOT NULL
  AND lesson_space_session_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE public.lesson_transcriptions
SET transcription_status = 'pending', updated_at = now()
WHERE transcription_status = 'processing'
  AND created_at < now() - interval '3 hours';
