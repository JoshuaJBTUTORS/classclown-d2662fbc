-- Add 30 minutes to Elena Zinici's voice session quota
UPDATE voice_session_quotas 
SET 
  bonus_minutes = bonus_minutes + 30,
  total_minutes_allowed = total_minutes_allowed + 30,
  updated_at = NOW()
WHERE user_id = '61f564d7-241d-4d89-94e2-5e43cc59752a';