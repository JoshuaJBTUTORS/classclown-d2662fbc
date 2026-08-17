ALTER TABLE public.tutor_punctuality
  ADD COLUMN IF NOT EXISTS students_waiting_since timestamptz,
  ADD COLUMN IF NOT EXISTS unattended_alert_sent_at timestamptz;