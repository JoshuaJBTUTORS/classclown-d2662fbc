GRANT SELECT ON public.heycleo_students TO authenticated;
GRANT SELECT ON public.heycleo_homework_completion TO authenticated;

CREATE POLICY "Tutors can view heycleo students"
ON public.heycleo_students
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'tutor'::app_role));

CREATE POLICY "Tutors can view heycleo homework"
ON public.heycleo_homework_completion
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'tutor'::app_role));