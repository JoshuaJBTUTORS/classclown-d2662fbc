-- Create demo tables and flags
CREATE TABLE IF NOT EXISTS public.demo_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demo_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  demo_config_id UUID REFERENCES public.demo_configurations(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add is_demo_data flags to existing tables
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tutors ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT FALSE;
ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT FALSE;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT FALSE;
ALTER TABLE public.homework ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT FALSE;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT FALSE;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN DEFAULT FALSE;

-- Enable RLS on demo tables
ALTER TABLE public.demo_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_users ENABLE ROW LEVEL SECURITY;

-- Create policies for demo tables
CREATE POLICY "Demo configurations are viewable by everyone" 
ON public.demo_configurations FOR SELECT USING (true);

CREATE POLICY "Demo users are viewable by everyone" 
ON public.demo_users FOR SELECT USING (true);