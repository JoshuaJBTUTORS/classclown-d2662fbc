-- Add column to track if 10-minute imminent reminder was sent for demo lessons
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS imminent_reminder_sent BOOLEAN DEFAULT false;

-- Add index for faster queries on demo lessons needing imminent reminders
CREATE INDEX IF NOT EXISTS idx_lessons_imminent_reminder 
ON public.lessons(lesson_type, start_time, imminent_reminder_sent, status)
WHERE lesson_type = 'demo' AND status = 'scheduled';

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to check for imminent demos every 5 minutes
SELECT cron.schedule(
  'demo-imminent-reminders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-demo-imminent-reminder',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);