-- Add trial tracking columns to course_purchases table
ALTER TABLE public.course_purchases 
ADD COLUMN has_used_trial boolean DEFAULT false,
ADD COLUMN trial_used_date timestamp with time zone;

-- Update existing records that have trial_end dates to mark them as having used a trial
UPDATE public.course_purchases 
SET has_used_trial = true, 
    trial_used_date = COALESCE(purchase_date, created_at)
WHERE trial_end IS NOT NULL;

-- Create index for efficient trial eligibility queries
CREATE INDEX idx_course_purchases_trial_tracking ON public.course_purchases(user_id, has_used_trial, course_id);