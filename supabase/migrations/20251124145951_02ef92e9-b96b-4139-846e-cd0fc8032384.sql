-- Remove outdated trigger using old session-based schema
DROP TRIGGER IF EXISTS on_profile_created_create_quota ON public.profiles;

-- Drop the outdated function that uses old session-based columns
DROP FUNCTION IF EXISTS public.create_initial_voice_quota();