-- Add 50 minutes to britney@classclown.io
UPDATE voice_session_quotas
SET 
  minutes_remaining = minutes_remaining + 50,
  bonus_minutes = bonus_minutes + 50,
  total_minutes_allowed = total_minutes_allowed + 50
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'britney@classclown.io'
);