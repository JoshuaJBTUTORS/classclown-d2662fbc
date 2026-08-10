ALTER TABLE public.recurring_lesson_groups
  ADD COLUMN IF NOT EXISTS schedule_weekday smallint,
  ADD COLUMN IF NOT EXISTS schedule_start_time time without time zone,
  ADD COLUMN IF NOT EXISTS schedule_end_time time without time zone,
  ADD COLUMN IF NOT EXISTS current_tutor_id uuid REFERENCES public.tutors(id);

COMMENT ON COLUMN public.recurring_lesson_groups.schedule_weekday IS 'Authoritative ISO weekday for future generation: Monday=1 through Sunday=7';
COMMENT ON COLUMN public.recurring_lesson_groups.schedule_start_time IS 'Authoritative Europe/London local start time for future generation';
COMMENT ON COLUMN public.recurring_lesson_groups.schedule_end_time IS 'Authoritative Europe/London local end time for future generation';
COMMENT ON COLUMN public.recurring_lesson_groups.current_tutor_id IS 'Authoritative tutor for future generated lessons; falls back to original lesson tutor when null';

CREATE OR REPLACE FUNCTION public.extend_recurring_lessons()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  recurring_group RECORD;
  lesson_record RECORD;
  new_lesson_id uuid;
  working_date date;
  extension_date date;
  days_to_add integer;
  uk_start_time time;
  uk_end_time time;
  new_start_ts timestamptz;
  new_end_ts timestamptz;
  hard_stop date;
  tutor_active boolean;
  effective_tutor_id uuid;
  student_total integer;
  student_live integer;
  series_lessons integer;
  lookback_lessons integer;
  start_week date;
  target_isodow integer;
  is_weekly boolean;
BEGIN
  FOR recurring_group IN
    SELECT * FROM public.recurring_lesson_groups
    WHERE next_extension_date <= now() + interval '7 days'
  LOOP
    SELECT * INTO lesson_record
    FROM public.lessons
    WHERE id = recurring_group.original_lesson_id;

    IF lesson_record.id IS NULL THEN
      DELETE FROM public.recurring_lesson_groups WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    effective_tutor_id := COALESCE(recurring_group.current_tutor_id, lesson_record.tutor_id);

    SELECT (t.status = 'active') INTO tutor_active
    FROM public.tutors t WHERE t.id = effective_tutor_id;

    IF tutor_active IS DISTINCT FROM true THEN
      UPDATE public.recurring_lesson_groups
      SET next_extension_date = now() + interval '100 years',
          instances_generated_until = now(),
          updated_at = now()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    SELECT count(*),
           count(*) FILTER (WHERE COALESCE(s.status, '') NOT IN ('inactive', 'stopped'))
      INTO student_total, student_live
    FROM public.lesson_students ls
    JOIN public.students s ON s.id = ls.student_id
    WHERE ls.lesson_id = recurring_group.original_lesson_id;

    IF student_total = 0 OR student_live = 0 THEN
      UPDATE public.recurring_lesson_groups
      SET next_extension_date = now() + interval '100 years',
          instances_generated_until = now(),
          updated_at = now()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    working_date := recurring_group.next_extension_date::date;
    start_week := date_trunc('week', working_date)::date;

    SELECT count(*) INTO series_lessons
    FROM public.lessons
    WHERE id = lesson_record.id OR parent_lesson_id = lesson_record.id;

    SELECT count(*) INTO lookback_lessons
    FROM public.lessons
    WHERE (id = lesson_record.id OR parent_lesson_id = lesson_record.id)
      AND (start_time AT TIME ZONE 'Europe/London')::date >= start_week - 14
      AND (start_time AT TIME ZONE 'Europe/London')::date < start_week;

    IF series_lessons = 0 OR lookback_lessons = 0 THEN
      UPDATE public.recurring_lesson_groups
      SET next_extension_date = now() + interval '100 years',
          instances_generated_until = now(),
          is_infinite = false,
          updated_at = now()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    IF recurring_group.is_infinite = false
       AND recurring_group.instances_generated_until IS NOT NULL
       AND recurring_group.instances_generated_until < now() THEN
      CONTINUE;
    END IF;

    extension_date := working_date + interval '3 months';

    SELECT min(cancelled_from) INTO hard_stop
    FROM public.recurring_lesson_cancellations
    WHERE parent_lesson_id = lesson_record.id
      AND cancelled_from IS NOT NULL;

    IF hard_stop IS NOT NULL AND hard_stop <= working_date THEN
      CONTINUE;
    END IF;

    uk_start_time := COALESCE(recurring_group.schedule_start_time, (lesson_record.start_time AT TIME ZONE 'Europe/London')::time);
    uk_end_time := COALESCE(recurring_group.schedule_end_time, (lesson_record.end_time AT TIME ZONE 'Europe/London')::time);

    IF lesson_record.recurrence_interval = 'daily' THEN
      days_to_add := 1;
    ELSIF lesson_record.recurrence_interval = 'biweekly' THEN
      days_to_add := 14;
    ELSIF lesson_record.recurrence_interval = 'monthly' THEN
      days_to_add := 30;
    ELSE
      days_to_add := 7;
    END IF;

    is_weekly := days_to_add IN (7, 14);

    IF is_weekly THEN
      target_isodow := COALESCE(recurring_group.schedule_weekday::integer,
        extract(isodow FROM lesson_record.start_time AT TIME ZONE 'Europe/London')::integer);
      working_date := working_date
        + (((target_isodow - extract(isodow FROM working_date)::integer) % 7) + 7) % 7;
    ELSE
      working_date := working_date + days_to_add;
    END IF;

    WHILE working_date <= extension_date LOOP
      IF hard_stop IS NOT NULL AND working_date >= hard_stop THEN
        EXIT;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM public.recurring_lesson_cancellations
        WHERE parent_lesson_id = lesson_record.id
          AND cancelled_date = working_date
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.lessons
        WHERE (parent_lesson_id = lesson_record.id OR id = lesson_record.id)
          AND (
            (start_time AT TIME ZONE 'Europe/London')::date = working_date
            OR (
              is_weekly
              AND date_trunc('week', (start_time AT TIME ZONE 'Europe/London')::date)
                  = date_trunc('week', working_date::timestamp)
            )
          )
      ) THEN
        new_start_ts := (working_date || ' ' || uk_start_time)::timestamp AT TIME ZONE 'Europe/London';
        new_end_ts := (working_date || ' ' || uk_end_time)::timestamp AT TIME ZONE 'Europe/London';

        INSERT INTO public.lessons (
          title, description, tutor_id, start_time, end_time,
          is_group, status, subject, lesson_type, is_recurring,
          recurrence_interval, recurrence_day, recurrence_end_date,
          parent_lesson_id
        ) VALUES (
          lesson_record.title,
          lesson_record.description,
          effective_tutor_id,
          new_start_ts,
          new_end_ts,
          lesson_record.is_group,
          'scheduled',
          lesson_record.subject,
          lesson_record.lesson_type,
          false,
          NULL, NULL, NULL,
          lesson_record.id
        ) RETURNING id INTO new_lesson_id;

        INSERT INTO public.lesson_students (lesson_id, student_id)
        SELECT new_lesson_id, ls.student_id
        FROM public.lesson_students ls
        JOIN public.students s ON s.id = ls.student_id
        WHERE ls.lesson_id = recurring_group.original_lesson_id
          AND COALESCE(s.status, '') NOT IN ('inactive', 'stopped');
      END IF;

      working_date := working_date + days_to_add;
    END LOOP;

    UPDATE public.recurring_lesson_groups
    SET next_extension_date = extension_date + interval '1 day',
        instances_generated_until = LEAST(extension_date, COALESCE(hard_stop - interval '1 day', extension_date)),
        updated_at = now()
    WHERE id = recurring_group.id;
  END LOOP;
END;
$function$;