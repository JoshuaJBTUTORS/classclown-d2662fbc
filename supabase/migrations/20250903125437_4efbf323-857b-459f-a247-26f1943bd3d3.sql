-- Enable necessary extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to send daily demo list every morning at 8:00 AM UK time
-- Note: Cron runs in UTC, so 8:00 AM UK time is 7:00 AM UTC (during BST) or 8:00 AM UTC (during GMT)
-- We'll use 7:00 AM UTC to ensure it works during British Summer Time
SELECT cron.schedule(
  'daily-demo-list-email',
  '0 7 * * *', -- 7:00 AM UTC (8:00 AM UK during BST, 7:00 AM UK during GMT)
  $$
  SELECT
    net.http_post(
        url:='https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/send-daily-demo-list',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
        body:='{"action": "send_daily_demo_list", "manual_trigger": false}'::jsonb
    ) as request_id;
  $$
);