-- 1) Atomic scoped lesson deletion
CREATE OR REPLACE FUNCTION public.delete_lesson_scoped(p_lesson_id uuid, p_scope text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lesson RECORD;
  v_parent_id uuid;
  v_cutoff date;
  v_ids uuid[];
  v_deleted integer := 0;
BEGIN
  IF p_scope NOT IN ('this_lesson_only','delete_from_date_onwards','all_recurring_lessons') THEN
    RAISE EXCEPTION 'Invalid delete scope: %', p_scope;
  END IF;

  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id;
  IF v_lesson.id IS NULL THEN
    RAISE EXCEPTION 'Lesson not found';
  END IF;

  IF NOT (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner') OR
    v_lesson.tutor_id = public.get_current_user_tutor_id()
  ) THEN
    RAISE EXCEPTION 'Not authorised to delete this lesson';
  END IF;

  v_parent_id := COALESCE(v_lesson.parent_lesson_id, CASE WHEN v_lesson.is_recurring THEN v_lesson.id END);
  v_cutoff := (v_lesson.start_time AT TIME ZONE 'Europe/London')::date;

  IF p_scope = 'this_lesson_only' OR v_parent_id IS NULL THEN
    v_ids := ARRAY[p_lesson_id];
    IF v_parent_id IS NOT NULL THEN
      INSERT INTO recurring_lesson_cancellations (parent_lesson_id, cancelled_date, reason, created_by)
      VALUES (v_parent_id, v_cutoff, 'single instance deleted', auth.uid());
    END IF;

  ELSIF p_scope = 'delete_from_date_onwards' THEN
    SELECT array_agg(id) INTO v_ids
    FROM lessons
    WHERE (id = v_parent_id OR parent_lesson_id = v_parent_id)
      AND start_time >= v_lesson.start_time;

    INSERT INTO recurring_lesson_cancellations (parent_lesson_id, cancelled_from, reason, created_by)
    VALUES (v_parent_id, v_cutoff, 'delete from date onwards', auth.uid());

    UPDATE recurring_lesson_groups
    SET is_infinite = false,
        instances_generated_until = v_lesson.start_time,
        next_extension_date = NOW() + INTERVAL '100 years',
        updated_at = NOW()
    WHERE original_lesson_id = v_parent_id;

  ELSE
    SELECT array_agg(id) INTO v_ids
    FROM lessons
    WHERE id = v_parent_id OR parent_lesson_id = v_parent_id;

    DELETE FROM recurring_lesson_groups WHERE original_lesson_id = v_parent_id;
    DELETE FROM recurring_lesson_cancellations WHERE parent_lesson_id = v_parent_id;
  END IF;

  v_ids := COALESCE(v_ids, ARRAY[p_lesson_id]);

  -- Related data cleanup
  DELETE FROM homework_submissions
   WHERE homework_id IN (SELECT id FROM homework WHERE lesson_id = ANY(v_ids));
  DELETE FROM homework WHERE lesson_id = ANY(v_ids);
  DELETE FROM lesson_attendance WHERE lesson_id = ANY(v_ids);
  DELETE FROM lesson_students WHERE lesson_id = ANY(v_ids);
  UPDATE trial_bookings SET lesson_id = NULL WHERE lesson_id = ANY(v_ids);

  -- Detach children when only the parent row is removed
  IF p_scope = 'this_lesson_only' AND v_lesson.is_recurring THEN
    UPDATE lessons SET parent_lesson_id = NULL WHERE parent_lesson_id = p_lesson_id;
    DELETE FROM recurring_lesson_groups WHERE original_lesson_id = p_lesson_id;
  END IF;

  DELETE FROM lessons WHERE id = ANY(v_ids);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object('deleted', v_deleted, 'scope', p_scope);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_lesson_scoped(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_lesson_scoped(uuid, text) TO service_role;

-- 2) Generator guards: empty series + two-week lookback
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
  tutor_active BOOLEAN;
  student_total INTEGER;
  student_live INTEGER;
  series_lessons INTEGER;
  lookback_lessons INTEGER;
  start_week DATE;
BEGIN
  FOR recurring_group IN
    SELECT * FROM recurring_lesson_groups
    WHERE next_extension_date <= NOW() + INTERVAL '7 days'
  LOOP
    SELECT * INTO lesson_record FROM lessons WHERE id = recurring_group.original_lesson_id;

    IF lesson_record.id IS NULL THEN
      DELETE FROM recurring_lesson_groups WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    -- Guard 1: tutor must still be active
    SELECT (t.status = 'active') INTO tutor_active
    FROM tutors t WHERE t.id = lesson_record.tutor_id;

    IF tutor_active IS DISTINCT FROM TRUE THEN
      UPDATE recurring_lesson_groups
      SET next_extension_date = NOW() + INTERVAL '100 years',
          instances_generated_until = NOW(),
          updated_at = NOW()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    -- Guards 2 & 3: must have students, and at least one not stopped/inactive
    SELECT COUNT(*),
           COUNT(*) FILTER (WHERE COALESCE(s.status, '') NOT IN ('inactive', 'stopped'))
      INTO student_total, student_live
    FROM lesson_students ls
    JOIN students s ON s.id = ls.student_id
    WHERE ls.lesson_id = recurring_group.original_lesson_id;

    IF student_total = 0 OR student_live = 0 THEN
      UPDATE recurring_lesson_groups
      SET next_extension_date = NOW() + INTERVAL '100 years',
          instances_generated_until = NOW(),
          updated_at = NOW()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    working_date := recurring_group.next_extension_date::DATE;
    start_week := date_trunc('week', working_date)::DATE;

    -- Guard 4: series must still have lessons at all
    SELECT COUNT(*) INTO series_lessons
    FROM lessons
    WHERE id = lesson_record.id OR parent_lesson_id = lesson_record.id;

    -- Guard 5: two-week lookback. A live series must have had a lesson in the
    -- 14 days before the week we are about to generate from.
    SELECT COUNT(*) INTO lookback_lessons
    FROM lessons
    WHERE (id = lesson_record.id OR parent_lesson_id = lesson_record.id)
      AND (start_time AT TIME ZONE 'Europe/London')::date >= start_week - 14
      AND (start_time AT TIME ZONE 'Europe/London')::date < start_week;

    IF series_lessons = 0 OR lookback_lessons = 0 THEN
      UPDATE recurring_lesson_groups
      SET next_extension_date = NOW() + INTERVAL '100 years',
          instances_generated_until = NOW(),
          is_infinite = false,
          updated_at = NOW()
      WHERE id = recurring_group.id;
      CONTINUE;
    END IF;

    -- Series capped? Skip.
    IF recurring_group.is_infinite = false
       AND recurring_group.instances_generated_until IS NOT NULL
       AND recurring_group.instances_generated_until < NOW() THEN
      CONTINUE;
    END IF;

    extension_date := working_date + INTERVAL '3 months';

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

      IF hard_stop IS NOT NULL AND working_date >= hard_stop THEN
        EXIT;
      END IF;

      IF EXISTS (
        SELECT 1 FROM recurring_lesson_cancellations
        WHERE parent_lesson_id = lesson_record.id
          AND cancelled_date = working_date
      ) THEN
        CONTINUE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM lessons
        WHERE DATE(start_time AT TIME ZONE 'Europe/London') = working_date
          AND (
            parent_lesson_id = lesson_record.id
            OR id = lesson_record.id
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
        SELECT new_lesson_id, ls.student_id
        FROM lesson_students ls
        JOIN students s ON s.id = ls.student_id
        WHERE ls.lesson_id = recurring_group.original_lesson_id
          AND COALESCE(s.status, '') NOT IN ('inactive', 'stopped');
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