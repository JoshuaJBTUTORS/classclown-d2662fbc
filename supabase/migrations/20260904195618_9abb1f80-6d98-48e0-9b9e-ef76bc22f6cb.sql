CREATE POLICY "Tutors can view topic requests for their lessons"
ON public.topic_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.lessons l
    WHERE l.id = topic_requests.lesson_id
      AND l.tutor_id = public.get_current_user_tutor_id()
  )
);

GRANT SELECT ON public.topic_requests TO authenticated;