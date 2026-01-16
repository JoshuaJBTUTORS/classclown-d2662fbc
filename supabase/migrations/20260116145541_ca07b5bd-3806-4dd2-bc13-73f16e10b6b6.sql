-- Create organizations table for Google Calendar settings
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT,
  logo_url TEXT,
  primary_color TEXT,
  status TEXT DEFAULT 'active',
  google_calendar_enabled BOOLEAN DEFAULT false,
  google_calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create google_calendar_credentials table for OAuth tokens
CREATE TABLE IF NOT EXISTS public.google_calendar_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create google_oauth_states table for OAuth flow security
CREATE TABLE IF NOT EXISTS public.google_oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes')
);

-- Add Google Meet columns to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS google_event_id TEXT,
ADD COLUMN IF NOT EXISTS video_conference_link TEXT,
ADD COLUMN IF NOT EXISTS video_conference_provider TEXT DEFAULT 'lessonspace';

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_oauth_states ENABLE ROW LEVEL SECURITY;

-- Organizations policies (admin access)
CREATE POLICY "Admins can view organizations" ON public.organizations
FOR SELECT USING (true);

CREATE POLICY "Admins can update organizations" ON public.organizations
FOR UPDATE USING (true);

-- Google calendar credentials policies (restricted)
CREATE POLICY "Service role can manage credentials" ON public.google_calendar_credentials
FOR ALL USING (true);

-- OAuth states policies (temporary, auto-cleanup)
CREATE POLICY "Service role can manage oauth states" ON public.google_oauth_states
FOR ALL USING (true);

-- Create cleanup function for expired OAuth states
CREATE OR REPLACE FUNCTION public.clean_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.google_oauth_states WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_oauth_states_state ON public.google_oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_lessons_google_event_id ON public.lessons(google_event_id);