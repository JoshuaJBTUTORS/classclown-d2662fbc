-- Add 20 bonus minutes to britney@classclown.io's voice quota
UPDATE voice_session_quotas
SET 
  bonus_minutes = COALESCE(bonus_minutes, 0) + 20,
  minutes_remaining = COALESCE(minutes_remaining, 0) + 20,
  updated_at = NOW()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'britney@classclown.io'
)
AND period_end > NOW();