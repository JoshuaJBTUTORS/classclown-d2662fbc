
-- Update platform_subscriptions table to ensure it has all required fields
ALTER TABLE public.platform_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'learning_hub';

-- Create function to check learning hub access
CREATE OR REPLACE FUNCTION public.check_learning_hub_access(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has active platform subscription
  RETURN EXISTS (
    SELECT 1 FROM public.platform_subscriptions 
    WHERE user_id = user_id_param 
    AND status IN ('active', 'trialing')
    AND (trial_end IS NULL OR trial_end > NOW())
    AND (current_period_end IS NULL OR current_period_end > NOW())
  );
END;
$$;

-- Create function to get user's platform subscription
CREATE OR REPLACE FUNCTION public.get_user_platform_subscription(user_id_param UUID)
RETURNS TABLE(
  id UUID,
  status TEXT,
  trial_end TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  has_used_trial BOOLEAN,
  grace_period_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id,
    ps.status,
    ps.trial_end,
    ps.current_period_end,
    ps.has_used_trial,
    ps.grace_period_end
  FROM public.platform_subscriptions ps
  WHERE ps.user_id = user_id_param
  ORDER BY ps.created_at DESC
  LIMIT 1;
END;
$$;

-- Update RLS policies for platform subscriptions to allow system updates
DROP POLICY IF EXISTS "System can update platform subscriptions" ON public.platform_subscriptions;
CREATE POLICY "System can update platform subscriptions"
ON public.platform_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);
