CREATE UNIQUE INDEX lessons_one_recurring_instance_per_start
ON public.lessons (parent_lesson_id, start_time)
WHERE parent_lesson_id IS NOT NULL;

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
  lookback_lessons integer;
  start_week date;
  target_isodow integer;
  is_weekly boolean;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('public.extend_recurring_lessons')) THEN
    RETURN;
  END IF;

  FOR recurring_group IN
    SELECT *
    FROM public.recurring_lesson_groups
    WHERE is_infinite = true
      AND next_extension_date <= now() + interval '7 days'
    FOR UPDATE SKIP LOCKED
  LOOP
    SELECT * INTO lesson_record
    FROM public.lessons
    WHERE id = recurring_group.original_lesson_id;

    IF lesson_record.id IS NULL THEN
      DELETE FROM public.recurring_lesson_groups WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    effective_tutor_id := recurring_group.current_tutor_id;

    SELECT (t.status = 'active') INTO tutor_active
    FROM public.tutors t
    WHERE t.id = effective_tutor_id;

    IF tutor_active IS DISTINCT FROM true THEN
      SELECT l.tutor_id INTO effective_tutor_id
      FROM public.lessons l
      JOIN public.tutors t ON t.id = l.tutor_id AND t.status = 'active'
      WHERE l.parent_lesson_id = lesson_record.id
        AND l.start_time < now()
      ORDER BY l.start_time DESC
      LIMIT 1;

      SELECT (t.status = 'active') INTO tutor_active
      FROM public.tutors t
      WHERE t.id = effective_tutor_id;

      IF tutor_active IS TRUE THEN
        UPDATE public.recurring_lesson_groups
        SET current_tutor_id = effective_tutor_id,
            updated_at = now()
        WHERE id = recurring_group.id;
      END IF;
    END IF;

    IF tutor_active IS DISTINCT FROM true THEN
      UPDATE public.recurring_lesson_groups
      SET is_infinite = false,
          next_extension_date = now() + interval '100 years',
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
      SET is_infinite = false,
          next_extension_date = now() + interval '100 years',
          instances_generated_until = now(),
          updated_at = now()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    working_date := recurring_group.next_extension_date::date;
    start_week := date_trunc('week', working_date)::date;

    SELECT count(*) INTO lookback_lessons
    FROM public.lessons
    WHERE (id = lesson_record.id OR parent_lesson_id = lesson_record.id)
      AND (start_time AT TIME ZONE 'Europe/London')::date >= start_week - 14
      AND (start_time AT TIME ZONE 'Europe/London')::date < start_week;

    IF lookback_lessons = 0 THEN
      UPDATE public.recurring_lesson_groups
      SET is_infinite = false,
          next_extension_date = now() + interval '100 years',
          instances_generated_until = now(),
          updated_at = now()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    extension_date := working_date + interval '3 months';

    SELECT min(cancelled_from) INTO hard_stop
    FROM public.recurring_lesson_cancellations
    WHERE parent_lesson_id = lesson_record.id
      AND cancelled_from IS NOT NULL;

    IF hard_stop IS NOT NULL AND hard_stop <= working_date THEN
      UPDATE public.recurring_lesson_groups
      SET is_infinite = false,
          next_extension_date = now() + interval '100 years',
          updated_at = now()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    uk_start_time := COALESCE(
      recurring_group.schedule_start_time,
      (lesson_record.start_time AT TIME ZONE 'Europe/London')::time
    );
    uk_end_time := COALESCE(
      recurring_group.schedule_end_time,
      (lesson_record.end_time AT TIME ZONE 'Europe/London')::time
    );

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
      target_isodow := COALESCE(
        recurring_group.schedule_weekday::integer,
        extract(isodow FROM lesson_record.start_time AT TIME ZONE 'Europe/London')::integer
      );
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
        SELECT 1
        FROM public.recurring_lesson_cancellations
        WHERE parent_lesson_id = lesson_record.id
          AND cancelled_date = working_date
      ) THEN
        new_start_ts := (working_date || ' ' || uk_start_time)::timestamp AT TIME ZONE 'Europe/London';
        new_end_ts := (working_date || ' ' || uk_end_time)::timestamp AT TIME ZONE 'Europe/London';
        new_lesson_id := NULL;

        INSERT INTO public.lessons (
          title, description, tutor_id, start_time, end_time,
          is_group, status, subject, lesson_type, is_recurring,
          is_recurring_instance, instance_date,
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
          true,
          working_date,
          NULL, NULL, NULL,
          lesson_record.id
        )
        ON CONFLICT (parent_lesson_id, start_time)
          WHERE parent_lesson_id IS NOT NULL
        DO NOTHING
        RETURNING id INTO new_lesson_id;

        IF new_lesson_id IS NOT NULL THEN
          INSERT INTO public.lesson_students (lesson_id, student_id)
          SELECT new_lesson_id, ls.student_id
          FROM public.lesson_students ls
          JOIN public.students s ON s.id = ls.student_id
          WHERE ls.lesson_id = recurring_group.original_lesson_id
            AND COALESCE(s.status, '') NOT IN ('inactive', 'stopped');
        END IF;
      END IF;

      working_date := working_date + days_to_add;
    END LOOP;

    UPDATE public.recurring_lesson_groups
    SET current_tutor_id = effective_tutor_id,
        schedule_weekday = CASE WHEN is_weekly THEN target_isodow ELSE schedule_weekday END,
        schedule_start_time = uk_start_time,
        schedule_end_time = uk_end_time,
        next_extension_date = extension_date + interval '1 day',
        instances_generated_until = LEAST(
          extension_date,
          COALESCE(hard_stop - interval '1 day', extension_date)
        ),
        updated_at = now()
    WHERE id = recurring_group.id;
  END LOOP;
END;
$function$;