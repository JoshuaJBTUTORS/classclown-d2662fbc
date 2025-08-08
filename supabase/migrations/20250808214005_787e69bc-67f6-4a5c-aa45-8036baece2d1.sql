
-- Create platform subscriptions table to track the single platform subscription per user
CREATE TABLE public.platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  has_used_trial BOOLEAN DEFAULT false,
  trial_used_date TIMESTAMPTZ,
  grace_period_start TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  previous_status TEXT
);

-- Enable Row Level Security
ALTER TABLE public.platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for platform subscriptions
CREATE POLICY "Users can view their own platform subscription" 
  ON public.platform_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platform subscription" 
  ON public.platform_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platform subscription" 
  ON public.platform_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_platform_subscriptions_user_id ON public.platform_subscriptions(user_id);
CREATE INDEX idx_platform_subscriptions_stripe_subscription_id ON public.platform_subscriptions(stripe_subscription_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_platform_subscriptions_updated_at
  BEFORE UPDATE ON public.platform_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();
