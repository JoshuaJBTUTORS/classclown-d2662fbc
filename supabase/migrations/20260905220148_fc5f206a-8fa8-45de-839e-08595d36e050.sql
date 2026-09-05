CREATE TABLE public.student_churn_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id BIGINT NOT NULL,
  student_name TEXT,
  parent_name TEXT,
  parent_email TEXT,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  score INTEGER NOT NULL DEFAULT 0,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  lessons_considered JSONB NOT NULL DEFAULT '[]'::jsonb,
  missed_streak INTEGER NOT NULL DEFAULT 0,
  missed_count INTEGER NOT NULL DEFAULT 0,
  avg_confidence NUMERIC,
  avg_engagement NUMERIC,
  avg_speaking_pct NUMERIC,
  peer_confidence_delta NUMERIC,
  peer_engagement_delta NUMERIC,
  peer_speaking_delta NUMERIC,
  status TEXT NOT NULL DEFAULT 'open',
  last_lesson_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.student_churn_risks TO authenticated;
GRANT ALL ON public.student_churn_risks TO service_role;

ALTER TABLE public.student_churn_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view churn risks"
ON public.student_churn_risks FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can update churn risks"
ON public.student_churn_risks FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE UNIQUE INDEX student_churn_risks_open_student_idx
ON public.student_churn_risks (student_id) WHERE status = 'open';

CREATE INDEX student_churn_risks_status_idx ON public.student_churn_risks (status, created_at DESC);

CREATE TRIGGER update_student_churn_risks_updated_at
BEFORE UPDATE ON public.student_churn_risks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.student_churn_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_id UUID NOT NULL REFERENCES public.student_churn_risks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (risk_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_churn_dismissals TO authenticated;
GRANT ALL ON public.student_churn_dismissals TO service_role;

ALTER TABLE public.student_churn_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own churn dismissals"
ON public.student_churn_dismissals FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());