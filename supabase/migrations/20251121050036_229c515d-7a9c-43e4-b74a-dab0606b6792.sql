-- Manually set up Elena Zinici's subscription and quota

-- 1. Create user_platform_subscriptions record with billing_interval
INSERT INTO user_platform_subscriptions (
  user_id,
  plan_id,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  billing_interval,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  '61f564d7-241d-4d89-94e2-5e43cc59752a',
  '2a7d87f7-f25f-4272-a657-2b0b297c6fd5',
  'cus_TSbbeNys3GHiTO',
  'sub_1SVgOQJYNQBAYpmixun7JolP',
  'active',
  'monthly',
  '2025-11-20 22:32:00+00',
  '2025-12-20 22:32:00+00',
  NOW(),
  NOW()
);

-- 2. Update voice_session_quotas to give 100 minutes
UPDATE voice_session_quotas 
SET 
  total_minutes_allowed = 100,
  minutes_remaining = 100,
  minutes_used = 0,
  period_start = '2025-11-20 22:32:00+00',
  period_end = '2025-12-20 22:32:00+00',
  updated_at = NOW()
WHERE user_id = '61f564d7-241d-4d89-94e2-5e43cc59752a'
  AND id = '1d1bc216-5e78-4034-8fab-7ea21906f88d';