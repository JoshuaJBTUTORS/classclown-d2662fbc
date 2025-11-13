-- Create function to automatically initialize voice quota for new users
CREATE OR REPLACE FUNCTION public.create_initial_voice_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a voice quota with 40 free minutes for the new user
  INSERT INTO public.voice_session_quotas (
    user_id,
    period_start,
    period_end,
    total_minutes_allowed,
    minutes_remaining,
    bonus_minutes,
    minutes_used,
    total_sessions_allowed,
    sessions_remaining,
    bonus_sessions
  ) VALUES (
    NEW.id,
    NOW(),
    NOW() + INTERVAL '365 days', -- 1 year validity for free tier
    40, -- Total minutes allowed
    40, -- Minutes remaining (starts at full)
    40, -- All 40 minutes are bonus (free)
    0,  -- No minutes used yet
    0,  -- No session limit, only minute-based
    0,  -- No sessions remaining
    0   -- No bonus sessions
  )
  ON CONFLICT (user_id, period_start) DO NOTHING; -- Prevent duplicates
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create quota when profile is created
DROP TRIGGER IF EXISTS on_profile_created_create_quota ON public.profiles;
CREATE TRIGGER on_profile_created_create_quota
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_initial_voice_quota();

-- Backfill: Give existing users without quotas 40 free minutes
INSERT INTO public.voice_session_quotas (
  user_id,
  period_start,
  period_end,
  total_minutes_allowed,
  minutes_remaining,
  bonus_minutes,
  minutes_used,
  total_sessions_allowed,
  sessions_remaining,
  bonus_sessions
)
SELECT 
  p.id as user_id,
  NOW() as period_start,
  NOW() + INTERVAL '365 days' as period_end,
  40 as total_minutes_allowed,
  40 as minutes_remaining,
  40 as bonus_minutes,
  0 as minutes_used,
  0 as total_sessions_allowed,
  0 as sessions_remaining,
  0 as bonus_sessions
FROM public.profiles p
LEFT JOIN public.voice_session_quotas q ON p.id = q.user_id
WHERE q.id IS NULL -- Only insert for users without existing quotas
ON CONFLICT (user_id, period_start) DO NOTHING;