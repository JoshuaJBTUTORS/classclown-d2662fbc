
-- Add the missing stripe_subscription_id column to course_purchases table
ALTER TABLE public.course_purchases 
ADD COLUMN stripe_subscription_id text;

-- Add an index for faster lookups by subscription ID
CREATE INDEX IF NOT EXISTS idx_course_purchases_stripe_subscription_id 
ON public.course_purchases(stripe_subscription_id);

-- Update the status column to include 'trialing' status for trial subscriptions
-- (This may already exist, but ensuring it's available)
-- No need to modify the column as it's already text type and can accept any value
