CREATE TABLE public.tutor_punctuality (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL UNIQUE REFERENCES public.lessons(id) ON DELETE CASCADE,
  tutor_id uuid,
  tutor_name text,
  lesson_start timestamptz NOT NULL,
  tutor_first_join_at timestamptz,
  minutes_late integer,
  status text NOT NULL DEFAULT 'pending',
  alert_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tutor_punctuality TO authenticated;
GRANT ALL ON public.tutor_punctuality TO service_role;

ALTER TABLE public.tutor_punctuality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tutor punctuality"
ON public.tutor_punctuality FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Tutors can view their own punctuality"
ON public.tutor_punctuality FOR SELECT TO authenticated
USING (tutor_id = public.get_current_user_tutor_id());

CREATE TRIGGER update_tutor_punctuality_updated_at
BEFORE UPDATE ON public.tutor_punctuality
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tutor_punctuality_start ON public.tutor_punctuality(lesson_start DESC);