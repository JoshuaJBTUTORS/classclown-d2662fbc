DO $mig$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.extend_recurring_lessons()'::regprocedure);
  d := replace(d,
    E'      AND EXISTS (SELECT 1 FROM public.lesson_students ls WHERE ls.lesson_id = lessons.id)\n    ORDER BY start_time DESC',
    E'      AND EXISTS (SELECT 1 FROM public.lesson_students ls WHERE ls.lesson_id = lessons.id)\n      -- Skip Assessment Week lessons (shared assessment room); use the week prior\n      AND COALESCE(lesson_space_room_id, '''') <> ''2670b244-b11f-4be3-8336-32bb2ce558e9''\n    ORDER BY start_time DESC');
  d := replace(d,
    E'      WHERE l.parent_lesson_id = lesson_record.id\n        AND l.start_time < now()\n      ORDER BY',
    E'      WHERE l.parent_lesson_id = lesson_record.id\n        AND l.start_time < now()\n        AND COALESCE(l.lesson_space_room_id, '''') <> ''2670b244-b11f-4be3-8336-32bb2ce558e9''\n      ORDER BY');
  IF (length(d) - length(replace(d, '2670b244-b11f-4be3-8336-32bb2ce558e9', ''))) / 36 <> 2 THEN
    RAISE EXCEPTION 'extend_recurring_lessons patch did not apply cleanly';
  END IF;
  EXECUTE d;
END
$mig$;