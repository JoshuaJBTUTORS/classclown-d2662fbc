
-- Add 20 bonus minutes to Katerina Gouveli's voice quota
UPDATE voice_session_quotas
SET 
  bonus_minutes = bonus_minutes + 20,
  total_minutes_allowed = total_minutes_allowed + 20
WHERE user_id = '02479bba-735d-4521-8630-62413d648693'
  AND period_end > NOW();
