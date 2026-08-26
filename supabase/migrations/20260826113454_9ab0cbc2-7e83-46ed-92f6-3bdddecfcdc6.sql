CREATE TABLE public.tutor_schedule_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  lesson_id uuid,
  change_type text NOT NULL,
  queued_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tutor_schedule_notifications TO authenticated;
GRANT ALL ON public.tutor_schedule_notifications TO service_role;

ALTER TABLE public.tutor_schedule_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tutor schedule notifications"
ON public.tutor_schedule_notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE INDEX idx_tutor_schedule_notifications_pending
ON public.tutor_schedule_notifications (tutor_id, queued_at)
WHERE sent_at IS NULL;

CREATE OR REPLACE FUNCTION public.queue_tutor_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.tutor_id IS NOT NULL
       AND NEW.start_time > now()
       AND COALESCE(NEW.status, 'scheduled') <> 'cancelled' THEN
      INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
      VALUES (NEW.tutor_id, NEW.id, 'added');
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.start_time > now() OR OLD.start_time > now() THEN
      IF NEW.tutor_id IS DISTINCT FROM OLD.tutor_id THEN
        IF OLD.tutor_id IS NOT NULL THEN
          INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
          VALUES (OLD.tutor_id, OLD.id, 'removed');
        END IF;
        IF NEW.tutor_id IS NOT NULL AND COALESCE(NEW.status, 'scheduled') <> 'cancelled' THEN
          INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
          VALUES (NEW.tutor_id, NEW.id, 'added');
        END IF;
      ELSIF COALESCE(NEW.status, 'scheduled') = 'cancelled'
            AND COALESCE(OLD.status, 'scheduled') <> 'cancelled'
            AND NEW.tutor_id IS NOT NULL THEN
        INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
        VALUES (NEW.tutor_id, NEW.id, 'removed');
      END IF;
    END IF;
    RETURN NEW;

  ELSE
    IF OLD.tutor_id IS NOT NULL
       AND OLD.start_time > now()
       AND COALESCE(OLD.status, 'scheduled') <> 'cancelled' THEN
      INSERT INTO public.tutor_schedule_notifications (tutor_id, lesson_id, change_type)
      VALUES (OLD.tutor_id, NULL, 'removed');
    END IF;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_queue_tutor_schedule_change
AFTER INSERT OR UPDATE OR DELETE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.queue_tutor_schedule_change();