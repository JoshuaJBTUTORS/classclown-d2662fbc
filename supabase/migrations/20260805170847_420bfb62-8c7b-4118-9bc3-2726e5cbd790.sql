CREATE TABLE public.lesson_participant_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  room_id text,
  session_id text,
  event_type text NOT NULL,
  participant_external_id text,
  participant_name text,
  participant_role text,
  is_leader boolean,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lpe_lesson ON public.lesson_participant_events(lesson_id, occurred_at DESC);
CREATE INDEX idx_lpe_room ON public.lesson_participant_events(room_id);

GRANT SELECT ON public.lesson_participant_events TO authenticated;
GRANT ALL ON public.lesson_participant_events TO service_role;

ALTER TABLE public.lesson_participant_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and owners can view participant events"
ON public.lesson_participant_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Tutors can view their own lesson participant events"
ON public.lesson_participant_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.lessons l
  WHERE l.id = lesson_participant_events.lesson_id
    AND l.tutor_id = public.get_current_user_tutor_id()
));