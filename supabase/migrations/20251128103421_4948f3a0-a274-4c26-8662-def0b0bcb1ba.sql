-- Add 20 minutes to joshuaekundayo1@gmail.com
UPDATE public.voice_session_quotas
SET 
  bonus_minutes = bonus_minutes + 20,
  total_minutes_allowed = total_minutes_allowed + 20
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'joshuaekundayo1@gmail.com'
)
AND period_end > NOW();