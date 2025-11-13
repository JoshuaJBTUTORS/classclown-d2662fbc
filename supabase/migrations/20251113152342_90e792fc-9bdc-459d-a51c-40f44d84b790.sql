-- Phase 1: Add minute-based columns to voice_session_quotas
ALTER TABLE voice_session_quotas 
  ADD COLUMN IF NOT EXISTS minutes_remaining INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minutes_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_minutes_allowed INTEGER DEFAULT 0;

-- Migrate existing session data to minutes (5 min per session)
UPDATE voice_session_quotas 
SET 
  minutes_remaining = COALESCE(sessions_remaining, 0) * 5,
  bonus_minutes = COALESCE(bonus_sessions, 0) * 5,
  minutes_used = COALESCE(sessions_used, 0) * 5,
  total_minutes_allowed = COALESCE(total_sessions_allowed, 0) * 5
WHERE minutes_remaining = 0 AND minutes_used = 0;

-- Add minute-based field to platform_subscription_plans
ALTER TABLE platform_subscription_plans 
  ADD COLUMN IF NOT EXISTS voice_minutes_per_month INTEGER;

-- Update existing plans with new minute allocations and pricing
UPDATE platform_subscription_plans 
SET 
  price_monthly_pence = 1000,
  voice_minutes_per_month = 50,
  description = 'Perfect for trying out the AI Tutor or light weekly practice'
WHERE name = 'Starter';

UPDATE platform_subscription_plans 
SET 
  price_monthly_pence = 2000,
  voice_minutes_per_month = 100,
  description = 'Great for consistent weekly usage and homework help'
WHERE name = 'Standard';

-- Deactivate old Plus and Premium plans
UPDATE platform_subscription_plans 
SET is_active = false 
WHERE name IN ('Plus', 'Premium');

-- Insert new Booster plan (set sessions to 0 since we're using minutes now)
INSERT INTO platform_subscription_plans (
  name, 
  description, 
  price_monthly_pence, 
  price_annual_pence,
  voice_sessions_per_month,
  voice_minutes_per_month, 
  features, 
  display_order,
  is_active
) VALUES (
  'Booster', 
  'Ideal for regular study sessions and revision planning',
  5000,
  51000,
  0,
  250,
  '["250 minutes of AI voice tutoring", "Access to all subjects", "Progress tracking", "Practice questions"]',
  3,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly_pence = EXCLUDED.price_monthly_pence,
  price_annual_pence = EXCLUDED.price_annual_pence,
  voice_sessions_per_month = EXCLUDED.voice_sessions_per_month,
  voice_minutes_per_month = EXCLUDED.voice_minutes_per_month,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Insert new Pro plan (set sessions to 0 since we're using minutes now)
INSERT INTO platform_subscription_plans (
  name,
  description,
  price_monthly_pence,
  price_annual_pence,
  voice_sessions_per_month,
  voice_minutes_per_month,
  features,
  display_order,
  is_active
) VALUES (
  'Pro',
  'Best for exam prep, frequent use, and families with multiple children',
  10000,
  102000,
  0,
  500,
  '["500 minutes of AI voice tutoring", "Access to all subjects", "Progress tracking", "Priority support", "Family sharing"]',
  4,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_monthly_pence = EXCLUDED.price_monthly_pence,
  price_annual_pence = EXCLUDED.price_annual_pence,
  voice_sessions_per_month = EXCLUDED.voice_sessions_per_month,
  voice_minutes_per_month = EXCLUDED.voice_minutes_per_month,
  features = EXCLUDED.features,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;

-- Add lesson duration estimation fields to cleo_lesson_plans
ALTER TABLE cleo_lesson_plans 
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS difficulty_score INTEGER,
  ADD COLUMN IF NOT EXISTS content_block_count INTEGER DEFAULT 0;

-- Add check constraint for difficulty_score
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cleo_lesson_plans_difficulty_score_check'
  ) THEN
    ALTER TABLE cleo_lesson_plans 
    ADD CONSTRAINT cleo_lesson_plans_difficulty_score_check 
    CHECK (difficulty_score IS NULL OR (difficulty_score >= 1 AND difficulty_score <= 10));
  END IF;
END $$;