-- Enable the pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to send morning lesson reminders (6 AM) for today's lessons
SELECT cron.schedule(
  'lesson-reminders-morning-regular',
  '0 6 * * *', -- Daily at 6 AM
  $$
  SELECT
    net.http_post(
        url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-lesson-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
        body:=concat('{"timeframe": "today", "scheduled_run": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create cron job to send morning trial lesson reminders (6 AM) for today's lessons
SELECT cron.schedule(
  'trial-lesson-reminders-morning',
  '0 6 * * *', -- Daily at 6 AM
  $$
  SELECT
    net.http_post(
        url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-trial-lesson-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
        body:=concat('{"timeframe": "today", "scheduled_run": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create cron job to send evening lesson reminders (8 PM) for tomorrow's lessons
SELECT cron.schedule(
  'lesson-reminders-evening-regular',
  '0 20 * * *', -- Daily at 8 PM
  $$
  SELECT
    net.http_post(
        url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-lesson-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
        body:=concat('{"timeframe": "tomorrow", "scheduled_run": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Create cron job to send evening trial lesson reminders (8 PM) for tomorrow's lessons
SELECT cron.schedule(
  'trial-lesson-reminders-evening',
  '0 20 * * *', -- Daily at 8 PM
  $$
  SELECT
    net.http_post(
        url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-trial-lesson-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
        body:=concat('{"timeframe": "tomorrow", "scheduled_run": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);