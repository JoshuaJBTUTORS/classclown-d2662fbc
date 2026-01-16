-- Fix google_calendar_credentials to match edge function expectations
ALTER TABLE public.google_calendar_credentials 
DROP COLUMN IF EXISTS token_expiry;

ALTER TABLE public.google_calendar_credentials 
ADD COLUMN IF NOT EXISTS expiry_date BIGINT,
ADD COLUMN IF NOT EXISTS token_type TEXT,
ADD COLUMN IF NOT EXISTS scope TEXT;

-- Make refresh_token nullable (in case token refresh provides no new refresh token)
ALTER TABLE public.google_calendar_credentials 
ALTER COLUMN refresh_token DROP NOT NULL;

-- Fix the cleanup function search_path
CREATE OR REPLACE FUNCTION public.clean_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.google_oauth_states WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;