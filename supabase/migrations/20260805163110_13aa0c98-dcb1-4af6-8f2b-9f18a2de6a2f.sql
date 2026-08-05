SELECT cron.unschedule('send-proposal-expiry-reminders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-proposal-expiry-reminders');

SELECT cron.schedule(
  'send-proposal-expiry-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://vqzmarffytkbdnnvmxxk.supabase.co/functions/v1/send-proposal-expiry-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);