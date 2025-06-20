
-- Add grace period fields to course_purchases table
ALTER TABLE public.course_purchases 
ADD COLUMN grace_period_start timestamp with time zone,
ADD COLUMN grace_period_end timestamp with time zone,
ADD COLUMN previous_status text,
ADD COLUMN trial_end timestamp with time zone;

-- Create index for efficient grace period queries
CREATE INDEX idx_course_purchases_grace_period ON public.course_purchases(grace_period_end) WHERE grace_period_end IS NOT NULL;

-- Create index for trial end queries
CREATE INDEX idx_course_purchases_trial_end ON public.course_purchases(trial_end) WHERE trial_end IS NOT NULL;
