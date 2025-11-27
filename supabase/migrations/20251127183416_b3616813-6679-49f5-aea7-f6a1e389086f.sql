
UPDATE voice_session_quotas
SET 
  bonus_minutes = bonus_minutes + 15,
  total_minutes_allowed = total_minutes_allowed + 15
WHERE user_id = '16e97246-3234-4f79-a5ab-62b19a1995bd'
  AND period_end > NOW();
