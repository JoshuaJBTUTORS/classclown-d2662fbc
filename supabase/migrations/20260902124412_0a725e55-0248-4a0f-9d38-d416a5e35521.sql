ALTER TABLE public.student_impact_moments
  ADD COLUMN IF NOT EXISTS impact_score integer,
  ADD COLUMN IF NOT EXISTS score_reason text;