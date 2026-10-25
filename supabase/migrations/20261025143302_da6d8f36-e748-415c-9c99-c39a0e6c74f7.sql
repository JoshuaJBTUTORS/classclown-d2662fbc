CREATE TABLE public.lesson_time_fix_backup_2026_10 (lesson_id uuid PRIMARY KEY, old_start timestamptz, old_end timestamptz, fixed_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.lesson_time_fix_backup_2026_10 TO service_role;
ALTER TABLE public.lesson_time_fix_backup_2026_10 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read time fix backup" ON public.lesson_time_fix_backup_2026_10 FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
GRANT SELECT ON public.lesson_time_fix_backup_2026_10 TO authenticated;

WITH ref AS (
  SELECT DISTINCT ON (coalesce(parent_lesson_id,id)) coalesce(parent_lesson_id,id) s, (start_time AT TIME ZONE 'Europe/London') r
  FROM public.lessons
  WHERE start_time BETWEEN '2026-10-11' AND '2026-10-25'
    AND coalesce(lesson_space_room_id,'') <> '2670b244-b11f-4be3-8336-32bb2ce558e9'
  ORDER BY coalesce(parent_lesson_id,id), start_time DESC
), targets AS (
  SELECT l.id, l.start_time, l.end_time
  FROM public.lessons l JOIN ref ON ref.s = coalesce(l.parent_lesson_id,l.id)
  WHERE l.start_time >= '2026-10-25'
    AND extract(isodow FROM l.start_time AT TIME ZONE 'Europe/London') = extract(isodow FROM r)
    AND extract(epoch FROM ((l.start_time AT TIME ZONE 'Europe/London')::time - r::time)) = -3600
    AND coalesce(l.lesson_space_room_id,'') <> '2670b244-b11f-4be3-8336-32bb2ce558e9'
), saved AS (
  INSERT INTO public.lesson_time_fix_backup_2026_10 (lesson_id, old_start, old_end)
  SELECT id, start_time, end_time FROM targets RETURNING lesson_id
)
UPDATE public.lessons l
SET start_time = l.start_time + interval '1 hour', end_time = l.end_time + interval '1 hour'
FROM saved WHERE saved.lesson_id = l.id;