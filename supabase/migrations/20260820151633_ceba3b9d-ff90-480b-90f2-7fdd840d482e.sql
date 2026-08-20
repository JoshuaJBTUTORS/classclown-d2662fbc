SELECT cron.unschedule('close-stale-assessment-sessions') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'close-stale-assessment-sessions');

SELECT cron.schedule(
  'close-stale-assessment-sessions',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sjxbxkpegcnnfjbsxazo.supabase.co/functions/v1/close-stale-assessment-sessions',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);