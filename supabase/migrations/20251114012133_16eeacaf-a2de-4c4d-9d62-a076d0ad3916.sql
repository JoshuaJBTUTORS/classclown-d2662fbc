-- Add 20 bonus minutes to Britney Lawrence's voice quota
UPDATE voice_session_quotas 
SET 
  bonus_minutes = bonus_minutes + 20,
  minutes_remaining = minutes_remaining + 20,
  updated_at = now()
WHERE user_id = '54ea0b01-d8dc-4980-b5a9-dfd12e5efc31';