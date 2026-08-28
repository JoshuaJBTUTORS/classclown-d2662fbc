CREATE OR REPLACE FUNCTION public.can_view_heycleo_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _email IS NOT NULL AND (
    lower(trim(_email)) = lower(trim(coalesce(public.get_current_user_email(), '')))
    OR EXISTS (
      SELECT 1 FROM public.parents p
      WHERE p.user_id = auth.uid() AND lower(trim(coalesce(p.email,''))) = lower(trim(_email))
    )
    OR EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.parents p ON p.id = s.parent_id
      WHERE p.user_id = auth.uid() AND lower(trim(coalesce(s.email,''))) = lower(trim(_email))
    )
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.user_id = auth.uid() AND lower(trim(coalesce(s.email,''))) = lower(trim(_email))
    )
    OR EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.parents p ON p.id = s.parent_id
      WHERE s.user_id = auth.uid() AND lower(trim(coalesce(p.email,''))) = lower(trim(_email))
    )
  );
$$;

DROP POLICY IF EXISTS "Families can view their heycleo student record" ON public.heycleo_students;
CREATE POLICY "Families can view their heycleo student record"
ON public.heycleo_students FOR SELECT TO authenticated
USING (public.can_view_heycleo_email(email));

DROP POLICY IF EXISTS "Families can view their heycleo homework" ON public.heycleo_homework_completion;
CREATE POLICY "Families can view their heycleo homework"
ON public.heycleo_homework_completion FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.heycleo_students hs
  WHERE hs.student_id = heycleo_homework_completion.student_id
    AND public.can_view_heycleo_email(hs.email)
));

GRANT SELECT ON public.heycleo_students TO authenticated;
GRANT SELECT ON public.heycleo_homework_completion TO authenticated;