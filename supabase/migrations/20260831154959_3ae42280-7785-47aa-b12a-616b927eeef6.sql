CREATE TABLE public.tutor_breaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  transcription_id uuid,
  tutor_id uuid,
  tutor_name text,
  lesson_title text,
  lesson_date timestamptz,
  students text,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  summary text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_breaches TO authenticated;
GRANT ALL ON public.tutor_breaches TO service_role;

ALTER TABLE public.tutor_breaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view breaches" ON public.tutor_breaches
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can update breaches" ON public.tutor_breaches
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_tutor_breaches_updated_at
  BEFORE UPDATE ON public.tutor_breaches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tutor_breach_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  breach_id uuid NOT NULL REFERENCES public.tutor_breaches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (breach_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.tutor_breach_dismissals TO authenticated;
GRANT ALL ON public.tutor_breach_dismissals TO service_role;

ALTER TABLE public.tutor_breach_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own breach dismissals" ON public.tutor_breach_dismissals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.breach_scan_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id uuid NOT NULL UNIQUE,
  lesson_id uuid,
  breaches_found integer NOT NULL DEFAULT 0,
  scan_error text,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.breach_scan_log TO authenticated;
GRANT ALL ON public.breach_scan_log TO service_role;

ALTER TABLE public.breach_scan_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view breach scan log" ON public.breach_scan_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE INDEX idx_tutor_breaches_status ON public.tutor_breaches(status, created_at DESC);