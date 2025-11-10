-- Create platform subscription plans table
CREATE TABLE IF NOT EXISTS public.platform_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly_pence INTEGER NOT NULL,
  price_annual_pence INTEGER NOT NULL,
  voice_sessions_per_month INTEGER NOT NULL,
  stripe_monthly_price_id TEXT UNIQUE,
  stripe_annual_price_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user platform subscriptions table
CREATE TABLE IF NOT EXISTS public.user_platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  plan_id UUID REFERENCES public.platform_subscription_plans NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('monthly', 'annual')),
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stripe_subscription_id)
);

-- Create voice session quotas table
CREATE TABLE IF NOT EXISTS public.voice_session_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_sessions_allowed INTEGER NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  sessions_remaining INTEGER NOT NULL,
  bonus_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Create voice session logs table
CREATE TABLE IF NOT EXISTS public.voice_session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  conversation_id UUID REFERENCES public.cleo_conversations,
  quota_id UUID REFERENCES public.voice_session_quotas,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  was_interrupted BOOLEAN DEFAULT false,
  deducted_from_quota BOOLEAN DEFAULT true,
  ai_cost_estimate_usd DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session pack purchases table
CREATE TABLE IF NOT EXISTS public.session_pack_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  pack_size INTEGER NOT NULL,
  price_paid_pence INTEGER NOT NULL,
  sessions_granted INTEGER NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add trial tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_completed_trial BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_completed_at TIMESTAMPTZ;

-- Enable RLS on all new tables
ALTER TABLE public.platform_subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_session_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_pack_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_subscription_plans (public read)
CREATE POLICY "Anyone can view active subscription plans"
ON public.platform_subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans"
ON public.platform_subscription_plans FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
));

-- RLS Policies for user_platform_subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.user_platform_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
ON public.user_platform_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
ON public.user_platform_subscriptions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.user_platform_subscriptions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
));

-- RLS Policies for voice_session_quotas
CREATE POLICY "Users can view own quotas"
ON public.voice_session_quotas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotas"
ON public.voice_session_quotas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotas"
ON public.voice_session_quotas FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for voice_session_logs
CREATE POLICY "Users can view own session logs"
ON public.voice_session_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session logs"
ON public.voice_session_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for session_pack_purchases
CREATE POLICY "Users can view own pack purchases"
ON public.session_pack_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pack purchases"
ON public.session_pack_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO public.platform_subscription_plans (name, description, price_monthly_pence, price_annual_pence, voice_sessions_per_month, display_order, features)
VALUES 
  ('Starter', 'Perfect for occasional learners', 1800, 18360, 15, 1, '["15 voice sessions per month", "5-minute sessions", "Access to all subjects", "Progress tracking"]'::jsonb),
  ('Standard', 'Best for regular learners', 3700, 37740, 30, 2, '["30 voice sessions per month", "5-minute sessions", "Access to all subjects", "Progress tracking", "Priority support"]'::jsonb),
  ('Plus', 'For dedicated students', 6100, 62220, 60, 3, '["60 voice sessions per month", "5-minute sessions", "Access to all subjects", "Progress tracking", "Priority support", "Advanced analytics"]'::jsonb),
  ('Premium', 'For intensive learning', 11000, 112200, 90, 4, '["90 voice sessions per month", "5-minute sessions", "Access to all subjects", "Progress tracking", "Priority support", "Advanced analytics", "Personal learning coach"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_platform_subscriptions_user_id ON public.user_platform_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_platform_subscriptions_status ON public.user_platform_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_voice_session_quotas_user_id ON public.voice_session_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_session_quotas_period ON public.voice_session_quotas(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_voice_session_logs_user_id ON public.voice_session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_session_logs_conversation_id ON public.voice_session_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_session_pack_purchases_user_id ON public.session_pack_purchases(user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_platform_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_subscription_plans_updated_at
BEFORE UPDATE ON public.platform_subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_platform_subscription_updated_at();

CREATE TRIGGER update_user_platform_subscriptions_updated_at
BEFORE UPDATE ON public.user_platform_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_platform_subscription_updated_at();

CREATE TRIGGER update_voice_session_quotas_updated_at
BEFORE UPDATE ON public.voice_session_quotas
FOR EACH ROW
EXECUTE FUNCTION public.update_platform_subscription_updated_at();