ALTER TABLE public.lesson_proposals
  ADD COLUMN IF NOT EXISTS reminder_12h_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_1h_sent_at TIMESTAMPTZ;