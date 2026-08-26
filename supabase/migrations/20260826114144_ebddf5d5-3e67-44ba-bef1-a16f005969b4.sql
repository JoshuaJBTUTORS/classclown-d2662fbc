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
        'apikey', v_anon_key
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

CREATE OR REPLACE FUNCTION public.schedule_tutor_notification(p_tutor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_job_name text := 'tutor-schedule-notification-' || p_tutor_id::text;
  v_run_at timestamptz;
  v_schedule text;
BEGIN
  IF p_tutor_id IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    PERFORM cron.unschedule(v_job_name);
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  v_run_at := date_trunc('minute', now() + interval '31 minutes');
  v_schedule := format(
    '%s %s %s %s *',
    extract(minute from v_run_at)::integer,
    extract(hour from v_run_at)::integer,
    extract(day from v_run_at)::integer,
    extract(month from v_run_at)::integer
  );

  PERFORM cron.schedule(
    v_job_name,
    v_schedule,
    format(
      'SELECT public.dispatch_tutor_schedule_notification(%L::uuid, %L::text)',
      p_tutor_id::text,
      v_job_name
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.schedule_tutor_notification(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_tutor_notification(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.queue_tutor_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_old_tutor_id uuid;
  v_new_tutor_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tutor_id IS NOT NULL
       AND NEW.start_time > now()
       AND COALESCE(NEW.status, 'scheduled') <> 'cancelled' THEN
      INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
      VALUES (NEW.tutor_id, NEW.id, 'added');
      PERFORM public.schedule_tutor_notification(NEW.tutor_id);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.start_time > now() OR OLD.start_time > now() THEN
      IF NEW.tutor_id IS DISTINCT FROM OLD.tutor_id THEN
        IF OLD.tutor_id IS NOT NULL THEN
          INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
          VALUES (OLD.tutor_id, OLD.id, 'removed');
          v_old_tutor_id := OLD.tutor_id;
        END IF;
        IF NEW.tutor_id IS NOT NULL AND COALESCE(NEW.status, 'scheduled') <> 'cancelled' THEN
          INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
          VALUES (NEW.tutor_id, NEW.id, 'added');
          v_new_tutor_id := NEW.tutor_id;
        END IF;
      ELSIF COALESCE(NEW.status, 'scheduled') = 'cancelled'
            AND COALESCE(OLD.status, 'scheduled') <> 'cancelled'
            AND NEW.tutor_id IS NOT NULL THEN
        INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
        VALUES (NEW.tutor_id, NEW.id, 'removed');
        v_old_tutor_id := NEW.tutor_id;
      END IF;
    END IF;

    IF v_old_tutor_id IS NOT NULL THEN
      PERFORM public.schedule_tutor_notification(v_old_tutor_id);
    END IF;
    IF v_new_tutor_id IS NOT NULL AND v_new_tutor_id IS DISTINCT FROM v_old_tutor_id THEN
      PERFORM public.schedule_tutor_notification(v_new_tutor_id);
    END IF;
    RETURN NEW;

  ELSE
    IF OLD.tutor_id IS NOT NULL
       AND OLD.start_time > now()
       AND COALESCE(OLD.status, 'scheduled') <> 'cancelled' THEN
      INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
      VALUES (OLD.tutor_id, NULL, 'removed');
      PERFORM public.schedule_tutor_notification(OLD.tutor_id);
    END IF;
    RETURN OLD;
  END IF;
END;
$$;