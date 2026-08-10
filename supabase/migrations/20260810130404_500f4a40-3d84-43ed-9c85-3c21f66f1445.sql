CREATE TABLE public.lesson_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL,
  parent_lesson_id uuid,
  scope text NOT NULL,
  title text,
  subject text,
  tutor_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  is_recurring boolean,
  deleted_by uuid,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lesson_deletion_log TO authenticated;
GRANT ALL ON public.lesson_deletion_log TO service_role;

ALTER TABLE public.lesson_deletion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and owners can view deletion log"
ON public.lesson_deletion_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE INDEX idx_lesson_deletion_log_parent ON public.lesson_deletion_log (parent_lesson_id);
CREATE INDEX idx_lesson_deletion_log_deleted_at ON public.lesson_deletion_log (deleted_at DESC);

CREATE OR REPLACE FUNCTION public.delete_lesson_scoped(p_lesson_id uuid, p_scope text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Permanent audit trail of everything about to be removed
  INSERT INTO lesson_deletion_log (
    lesson_id, parent_lesson_id, scope, title, subject, tutor_id,
    start_time, end_time, is_recurring, deleted_by
  )
  SELECT l.id, v_parent_id, p_scope, l.title, l.subject, l.tutor_id,
         l.start_time, l.end_time, l.is_recurring, auth.uid()
  FROM lessons l
  WHERE l.id = ANY(v_ids);

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
$function$;