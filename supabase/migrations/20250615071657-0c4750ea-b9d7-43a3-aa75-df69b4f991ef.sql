
-- Create revision schedules table to store user's revision preferences
CREATE TABLE public.revision_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Revision Schedule',
  weekly_hours INTEGER NOT NULL,
  selected_days TEXT[] NOT NULL, -- e.g., ['monday', 'wednesday', 'friday']
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create revision sessions table for individual revision sessions
CREATE TABLE public.revision_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES public.revision_schedules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'rescheduled')),
  completion_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create revision progress table to track detailed progress
CREATE TABLE public.revision_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.revision_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topics_covered TEXT[],
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  notes TEXT,
  time_spent_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.revision_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for revision_schedules
CREATE POLICY "Users can view their own revision schedules" 
  ON public.revision_schedules 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own revision schedules" 
  ON public.revision_schedules 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revision schedules" 
  ON public.revision_schedules 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revision schedules" 
  ON public.revision_schedules 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for revision_sessions
CREATE POLICY "Users can view their own revision sessions" 
  ON public.revision_sessions 
  FOR SELECT 
  USING (schedule_id IN (SELECT id FROM public.revision_schedules WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own revision sessions" 
  ON public.revision_sessions 
  FOR INSERT 
  WITH CHECK (schedule_id IN (SELECT id FROM public.revision_schedules WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own revision sessions" 
  ON public.revision_sessions 
  FOR UPDATE 
  USING (schedule_id IN (SELECT id FROM public.revision_schedules WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own revision sessions" 
  ON public.revision_sessions 
  FOR DELETE 
  USING (schedule_id IN (SELECT id FROM public.revision_schedules WHERE user_id = auth.uid()));

-- Create RLS policies for revision_progress
CREATE POLICY "Users can view their own revision progress" 
  ON public.revision_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own revision progress" 
  ON public.revision_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revision progress" 
  ON public.revision_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_revision_schedules_user_id ON public.revision_schedules(user_id);
CREATE INDEX idx_revision_sessions_schedule_id ON public.revision_sessions(schedule_id);
CREATE INDEX idx_revision_sessions_date ON public.revision_sessions(session_date);
CREATE INDEX idx_revision_progress_session_id ON public.revision_progress(session_id);
CREATE INDEX idx_revision_progress_user_id ON public.revision_progress(user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_revision_schedules_updated_at
  BEFORE UPDATE ON public.revision_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();

CREATE TRIGGER update_revision_sessions_updated_at
  BEFORE UPDATE ON public.revision_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();
