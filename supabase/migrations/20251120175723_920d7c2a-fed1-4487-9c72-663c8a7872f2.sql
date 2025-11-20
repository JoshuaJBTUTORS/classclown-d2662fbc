-- Manually sync Britney's Stripe subscription
-- User: britney@classclown.io (54ea0b01-d8dc-4980-b5a9-dfd12e5efc31)
-- Stripe Customer: cus_TSWcMKE5vslA7s
-- Stripe Subscription: sub_1SVbZiJYNQBAYpmiOFSzBxJF
-- Plan: Starter Monthly (50 minutes/month)

-- Insert subscription record
INSERT INTO user_platform_subscriptions (
  user_id,
  plan_id,
  stripe_subscription_id,
  stripe_customer_id,
  billing_interval,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  '54ea0b01-d8dc-4980-b5a9-dfd12e5efc31'::uuid,
  '772612ca-1736-4e97-8e9f-26422c2bf2a5'::uuid,
  'sub_1SVbZiJYNQBAYpmiOFSzBxJF',
  'cus_TSWcMKE5vslA7s',
  'monthly',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW(),
  NOW()
);

-- Reset her voice session quota to 50 minutes
UPDATE voice_session_quotas
SET 
  minutes_remaining = 50,
  bonus_minutes = 0,
  minutes_used = 0,
  total_minutes_allowed = 50,
  period_start = NOW(),
  period_end = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE user_id = '54ea0b01-d8dc-4980-b5a9-dfd12e5efc31';