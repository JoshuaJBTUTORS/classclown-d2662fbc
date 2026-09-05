select cron.schedule(
  'daily-churn-scan',
  '30 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/daily-churn-scan',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGJ4a3BlZ2NubmZqYnN4YXpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3MTE2NzIsImV4cCI6MjA2MzI4NzY3Mn0.QFNyi5omwRMPiL_nJlUOHo5ATwXd14PdQHfoG7oTnwA"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);