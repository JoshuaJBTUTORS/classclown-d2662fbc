
-- Add 20 bonus minutes to Britney Lawrence (britney@classclown.io)
UPDATE voice_session_quotas
SET 
  bonus_minutes = bonus_minutes + 20,
  minutes_remaining = minutes_remaining + 20,
  total_minutes_allowed = total_minutes_allowed + 20
WHERE id = '896361d9-c4b1-48b7-bea4-653759ac7f14';
