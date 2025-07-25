-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing lesson reminder cron jobs if they exist
SELECT cron.unschedule('lesson-reminders-morning-regular');
SELECT cron.unschedule('lesson-reminders-evening-regular');
SELECT cron.unschedule('trial-lesson-reminders-morning');
SELECT cron.unschedule('trial-lesson-reminders-evening');
SELECT cron.unschedule('generate-recurring-lessons-daily');

-- Update existing cleanup job to UK timezone (1 AM UTC = 2 AM BST, 2 AM GMT)
SELECT cron.unschedule('cleanup-old-time-off-requests');
SELECT cron.schedule(
  'cleanup-old-time-off-requests',
  '0 1 * * *', -- 1 AM UTC = 2 AM BST / 2 AM GMT (winter adjustment handled by separate schedule)
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/cleanup-time-off-requests',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);

-- Create morning lesson reminders for regular lessons (5 AM UTC = 6 AM BST / 6 AM GMT)
SELECT cron.schedule(
  'lesson-reminders-morning-regular',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-lesson-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"timeframe": "today"}'::jsonb
  );
  $$
);

-- Create evening lesson reminders for regular lessons (19 PM UTC = 8 PM BST / 20 PM UTC = 8 PM GMT)
SELECT cron.schedule(
  'lesson-reminders-evening-regular',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-lesson-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"timeframe": "tomorrow"}'::jsonb
  );
  $$
);

-- Create morning trial lesson reminders (5 AM UTC = 6 AM BST / 6 AM GMT)
SELECT cron.schedule(
  'trial-lesson-reminders-morning',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-trial-lesson-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"timeframe": "today"}'::jsonb
  );
  $$
);

-- Create evening trial lesson reminders (19 PM UTC = 8 PM BST / 20 PM UTC = 8 PM GMT)
SELECT cron.schedule(
  'trial-lesson-reminders-evening',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-trial-lesson-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"timeframe": "tomorrow"}'::jsonb
  );
  $$
);

-- Create recurring lessons generation (1 AM UTC = 2 AM BST / 2 AM GMT)
SELECT cron.schedule(
  'generate-recurring-lessons-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/generate-recurring-lessons',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);