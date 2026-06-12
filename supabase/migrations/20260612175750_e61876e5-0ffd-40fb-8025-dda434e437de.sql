
-- 1. Cancellations table
CREATE TABLE IF NOT EXISTS public.recurring_lesson_cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_lesson_id uuid NOT NULL,
  cancelled_date date,
  cancelled_from date,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cancelled_date IS NOT NULL OR cancelled_from IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS recurring_lesson_cancellations_parent_idx
  ON public.recurring_lesson_cancellations (parent_lesson_id);
CREATE INDEX IF NOT EXISTS recurring_lesson_cancellations_date_idx
  ON public.recurring_lesson_cancellations (parent_lesson_id, cancelled_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_lesson_cancellations TO authenticated;
GRANT ALL ON public.recurring_lesson_cancellations TO service_role;

ALTER TABLE public.recurring_lesson_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins, owners and lesson tutors can view cancellations"
  ON public.recurring_lesson_cancellations FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = parent_lesson_id
        AND l.tutor_id = public.get_current_user_tutor_id()
    )
  );

CREATE POLICY "Admins, owners and lesson tutors can insert cancellations"
  ON public.recurring_lesson_cancellations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      WHERE l.id = parent_lesson_id
        AND l.tutor_id = public.get_current_user_tutor_id()
    )
  );

CREATE POLICY "Admins and owners can delete cancellations"
  ON public.recurring_lesson_cancellations FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'owner')
  );

-- 2. Rewrite extender
CREATE OR REPLACE FUNCTION public.extend_recurring_lessons()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  recurring_group RECORD;
  lesson_record RECORD;
  new_lesson_id UUID;
  working_date DATE;
  extension_date DATE;
  days_to_add INTEGER;
  uk_start_time TIME;
  uk_end_time TIME;
  new_start_ts TIMESTAMPTZ;
  new_end_ts TIMESTAMPTZ;
  hard_stop DATE;
BEGIN
  FOR recurring_group IN
    SELECT * FROM recurring_lesson_groups
    WHERE next_extension_date <= NOW() + INTERVAL '7 days'
  LOOP
    SELECT * INTO lesson_record FROM lessons WHERE id = recurring_group.original_lesson_id;

    -- Parent lesson deleted? Skip and clean group.
    IF lesson_record.id IS NULL THEN
      DELETE FROM recurring_lesson_groups WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    -- Series capped? Skip.
    IF recurring_group.is_infinite = false
       AND recurring_group.instances_generated_until IS NOT NULL
       AND recurring_group.instances_generated_until < NOW() THEN
      CONTINUE;
    END IF;

    working_date := recurring_group.next_extension_date::DATE;
    extension_date := working_date + INTERVAL '3 months';

    -- Earliest "cancelled from" date for this series
    SELECT MIN(cancelled_from) INTO hard_stop
    FROM recurring_lesson_cancellations
    WHERE parent_lesson_id = lesson_record.id
      AND cancelled_from IS NOT NULL;

    IF hard_stop IS NOT NULL AND hard_stop <= working_date THEN
      CONTINUE;
    END IF;

    uk_start_time := (lesson_record.start_time AT TIME ZONE 'Europe/London')::TIME;
    uk_end_time := (lesson_record.end_time AT TIME ZONE 'Europe/London')::TIME;

    WHILE working_date <= extension_date LOOP
      IF lesson_record.recurrence_interval = 'daily' THEN
        days_to_add := 1;
      ELSIF lesson_record.recurrence_interval = 'biweekly' THEN
        days_to_add := 14;
      ELSIF lesson_record.recurrence_interval = 'monthly' THEN
        days_to_add := 30;
      ELSE
        days_to_add := 7;
      END IF;

      working_date := working_date + days_to_add;

      -- Respect hard stop
      IF hard_stop IS NOT NULL AND working_date >= hard_stop THEN
        EXIT;
      END IF;

      -- Skip single-date cancellations
      IF EXISTS (
        SELECT 1 FROM recurring_lesson_cancellations
        WHERE parent_lesson_id = lesson_record.id
          AND cancelled_date = working_date
      ) THEN
        CONTINUE;
      END IF;

      -- Skip if an instance already exists (match by parent_lesson_id when present)
      IF NOT EXISTS (
        SELECT 1 FROM lessons
        WHERE DATE(start_time AT TIME ZONE 'Europe/London') = working_date
          AND tutor_id = lesson_record.tutor_id
          AND (
            parent_lesson_id = lesson_record.id
            OR id = lesson_record.id
            OR title = lesson_record.title
          )
      ) AND working_date <= extension_date THEN

        new_start_ts := (working_date || ' ' || uk_start_time)::timestamp AT TIME ZONE 'Europe/London';
        new_end_ts := (working_date || ' ' || uk_end_time)::timestamp AT TIME ZONE 'Europe/London';

        INSERT INTO lessons (
          title, description, tutor_id, start_time, end_time,
          is_group, status, subject, lesson_type, is_recurring,
          recurrence_interval, recurrence_day, recurrence_end_date,
          parent_lesson_id
        ) VALUES (
          lesson_record.title,
          lesson_record.description,
          lesson_record.tutor_id,
          new_start_ts,
          new_end_ts,
          lesson_record.is_group,
          'scheduled',
          lesson_record.subject,
          lesson_record.lesson_type,
          FALSE,
          NULL, NULL, NULL,
          lesson_record.id
        ) RETURNING id INTO new_lesson_id;

        INSERT INTO lesson_students (lesson_id, student_id)
        SELECT new_lesson_id, student_id
        FROM lesson_students
        WHERE lesson_id = recurring_group.original_lesson_id;
      END IF;
    END LOOP;

    UPDATE recurring_lesson_groups
    SET next_extension_date = extension_date + INTERVAL '1 day',
        instances_generated_until = LEAST(extension_date, COALESCE(hard_stop - INTERVAL '1 day', extension_date)),
        updated_at = NOW()
    WHERE id = recurring_group.id;
  END LOOP;
END;
$function$;
