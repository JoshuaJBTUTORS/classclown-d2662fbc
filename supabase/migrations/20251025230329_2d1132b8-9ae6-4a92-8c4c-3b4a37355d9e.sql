-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily proposal reminders at 8:30 PM (20:30) every day
SELECT cron.schedule(
  'send-daily-proposal-reminders',
  '30 20 * * *',  -- 8:30 PM every day
  $$
  SELECT
    net.http_post(
      url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-daily-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);