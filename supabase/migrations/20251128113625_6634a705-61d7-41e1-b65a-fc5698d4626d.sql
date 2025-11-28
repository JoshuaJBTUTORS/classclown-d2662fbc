UPDATE voice_session_quotas
SET 
  bonus_minutes = bonus_minutes + 100,
  total_minutes_allowed = total_minutes_allowed + 100
WHERE id = 'fb9b239e-a6b1-449c-b76e-e792e8b73661';