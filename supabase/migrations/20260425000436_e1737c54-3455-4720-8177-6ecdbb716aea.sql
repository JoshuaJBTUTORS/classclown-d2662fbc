-- 1) Allow review_room as a valid lesson_type
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_lesson_type_check;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_lesson_type_check
  CHECK (lesson_type = ANY (ARRAY['regular'::text, 'trial'::text, 'makeup'::text, 'demo'::text, 'review_room'::text]));

-- 2) Schedule cron jobs for Review Room reminders (mirrors trial reminders)
SELECT cron.unschedule('review-room-reminders-morning') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'review-room-reminders-morning');
SELECT cron.unschedule('review-room-reminders-evening') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'review-room-reminders-evening');

SELECT cron.schedule(
  'review-room-reminders-morning',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-review-room-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"timeframe": "today"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'review-room-reminders-evening',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-review-room-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"timeframe": "tomorrow"}'::jsonb
  );
  $$
);