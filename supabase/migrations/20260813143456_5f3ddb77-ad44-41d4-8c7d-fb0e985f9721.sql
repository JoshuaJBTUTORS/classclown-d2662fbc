ALTER TABLE public.lesson_transcriptions
  ADD COLUMN IF NOT EXISTS transcript_poll_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_poll_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_poll_error text;

CREATE INDEX IF NOT EXISTS idx_lesson_transcriptions_next_poll
  ON public.lesson_transcriptions (next_poll_at)
  WHERE transcription_status <> 'completed';

UPDATE public.lesson_transcriptions
SET next_poll_at = now()
WHERE transcription_status NOT IN ('completed', 'unavailable')
  AND next_poll_at IS NULL;