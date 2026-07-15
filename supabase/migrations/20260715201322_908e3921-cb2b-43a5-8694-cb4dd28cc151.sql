
-- One-off cleanup: reset the stale pre-lesson transcript row for
-- 1:1 GCSE Biology (15 Jul 2026 20:00 UTC) so the next hourly cron run
-- fetches the real transcript and regenerates the AI summary.
UPDATE public.lesson_transcriptions
SET transcription_status = 'pending',
    expires_at = NULL,
    processing_notes = NULL,
    last_processing_error = NULL,
    processing_attempts = 0,
    updated_at = now()
WHERE lesson_id = '3dc71a4b-78d6-4ec2-abf4-b5ae2df565d6';

-- Drop the stale summary so generate-lesson-summaries doesn't hit its
-- onConflict guard on (lesson_id, student_id, transcription_id).
-- The sync_student_lesson_insight trigger will null the insight row,
-- and a fresh summary from the next cron run will repopulate everything.
DELETE FROM public.lesson_student_summaries
WHERE lesson_id = '3dc71a4b-78d6-4ec2-abf4-b5ae2df565d6';
