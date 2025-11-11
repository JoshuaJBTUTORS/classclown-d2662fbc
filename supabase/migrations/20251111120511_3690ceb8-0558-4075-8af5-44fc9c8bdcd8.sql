-- Create function to automatically grant 3 free voice sessions to new users
CREATE OR REPLACE FUNCTION public.initialize_free_session_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  period_start timestamptz;
  period_end timestamptz;
BEGIN
  period_start := NOW();
  period_end := period_start + INTERVAL '30 days';
  
  -- Create 3 free session quota for new user
  INSERT INTO public.voice_session_quotas (
    user_id,
    period_start,
    period_end,
    total_sessions_allowed,
    sessions_used,
    sessions_remaining,
    bonus_sessions
  ) VALUES (
    NEW.id,
    period_start,
    period_end,
    3,
    0,
    3,
    3 -- Mark as bonus/free sessions
  )
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table to grant free sessions after user creation
CREATE TRIGGER on_profile_created_initialize_quota
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_free_session_quota();