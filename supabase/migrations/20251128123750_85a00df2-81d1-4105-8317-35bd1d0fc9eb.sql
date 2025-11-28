UPDATE voice_session_quotas
SET 
  bonus_minutes = bonus_minutes + 100,
  total_minutes_allowed = total_minutes_allowed + 100
WHERE id = '2026d603-4a64-4ad0-8eed-47bcaab9087f';