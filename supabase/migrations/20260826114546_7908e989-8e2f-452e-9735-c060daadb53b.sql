CREATE OR REPLACE FUNCTION public.dispatch_tutor_schedule_notification(
  p_tutor_id uuid,
  p_job_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_anon_key text;
BEGIN
  SELECT value INTO v_url
  FROM public.app_settings
  WHERE key = 'tutor_schedule_notification_url';

  SELECT value INTO v_anon_key
  FROM public.app_settings
  WHERE key = 'tutor_schedule_notification_anon_key';

  IF v_url IS NULL OR v_anon_key IS NULL THEN
    RAISE WARNING 'Tutor schedule notification endpoint is not configured';
  ELSE
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', v_anon_key,
        'Authorization', 'Bearer ' || v_anon_key
      ),
      body := jsonb_build_object(
        'tutorId', p_tutor_id,
        'scheduled', true,
        'jobName', p_job_name
      )
    );
  END IF;

  PERFORM cron.unschedule(p_job_name);
EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      PERFORM cron.unschedule(p_job_name);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.dispatch_tutor_schedule_notification(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_tutor_schedule_notification(uuid, text) TO service_role;