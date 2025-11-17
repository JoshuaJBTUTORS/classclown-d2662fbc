
-- Reset all voice minute quotas to 15 minutes baseline
UPDATE voice_session_quotas 
SET 
  minutes_remaining = 15,
  bonus_minutes = 0,
  minutes_used = 0,
  total_minutes_allowed = 15
WHERE user_id IS NOT NULL;
