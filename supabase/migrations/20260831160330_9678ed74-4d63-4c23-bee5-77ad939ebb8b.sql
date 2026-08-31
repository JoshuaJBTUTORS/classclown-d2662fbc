CREATE TABLE public.student_impact_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  transcription_id uuid,
  student_id bigint,
  student_name text,
  tutor_id uuid,
  tutor_name text,
  lesson_title text,
  lesson_date timestamptz,
  category text NOT NULL,
  subject text,
  event_type text,
  timeframe text,
  event_date date,
  grade_or_target text,
  student_reaction text,
  urgency text NOT NULL DEFAULT 'medium',
  recommended_action text,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_impact_moments TO authenticated;
GRANT ALL ON public.student_impact_moments TO service_role;

ALTER TABLE public.student_impact_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view impact moments" ON public.student_impact_moments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can update impact moments" ON public.student_impact_moments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_student_impact_moments_updated_at
  BEFORE UPDATE ON public.student_impact_moments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_impact_moments_status ON public.student_impact_moments(status, created_at DESC);
CREATE INDEX idx_impact_moments_student ON public.student_impact_moments(student_id, created_at DESC);

ALTER TABLE public.breach_scan_log ADD COLUMN IF NOT EXISTS moments_found integer NOT NULL DEFAULT 0;