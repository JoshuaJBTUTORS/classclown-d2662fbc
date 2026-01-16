-- Create default organization for Google Calendar integration
INSERT INTO public.organizations (id, name, subdomain, status)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'JB Tutors',
  'jb-tutors',
  'active'
) ON CONFLICT (id) DO NOTHING;