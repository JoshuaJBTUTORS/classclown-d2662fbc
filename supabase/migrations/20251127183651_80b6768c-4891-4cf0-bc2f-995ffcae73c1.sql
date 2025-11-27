
UPDATE voice_session_quotas
SET 
  bonus_minutes = bonus_minutes + 15,
  total_minutes_allowed = total_minutes_allowed + 15
WHERE user_id = '8c9c0bef-5d7a-47ce-8481-b750dbd2f2a4'
  AND period_end > NOW();
