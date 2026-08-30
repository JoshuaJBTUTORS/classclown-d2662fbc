ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS year_group text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS platform_tour_completed_at timestamptz;