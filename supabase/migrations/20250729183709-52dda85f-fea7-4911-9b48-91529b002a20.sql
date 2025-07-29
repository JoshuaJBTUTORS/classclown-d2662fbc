-- Create admin_availability table
CREATE TABLE public.admin_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, day_of_week)
);

-- Enable RLS on admin_availability
ALTER TABLE public.admin_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_availability
CREATE POLICY "Admins can manage all admin availability" 
ON public.admin_availability 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "Users can view admin availability" 
ON public.admin_availability 
FOR SELECT 
USING (true);

-- Create demo_sessions table
CREATE TABLE public.demo_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on demo_sessions
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for demo_sessions
CREATE POLICY "Admins can manage all demo sessions" 
ON public.demo_sessions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "Users can view demo sessions for their lessons" 
ON public.demo_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM lessons l
  JOIN user_roles ur ON ur.user_id = auth.uid()
  WHERE l.id = demo_sessions.lesson_id
  AND (
    ur.role IN ('admin', 'owner')
    OR (ur.role = 'tutor' AND l.tutor_id = get_current_user_tutor_id())
    OR (ur.role IN ('student', 'parent') AND EXISTS (
      SELECT 1 FROM lesson_students ls
      WHERE ls.lesson_id = l.id
      AND (
        ls.student_id = get_current_user_student_id()
        OR ls.student_id IN (
          SELECT s.id FROM students s 
          WHERE s.parent_id = get_current_user_parent_id()
        )
      )
    ))
  )
));

-- Add admin_id to trial_bookings table
ALTER TABLE public.trial_bookings 
ADD COLUMN admin_id UUID;

-- Create updated_at trigger for new tables
CREATE TRIGGER update_admin_availability_updated_at
  BEFORE UPDATE ON public.admin_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_demo_sessions_updated_at
  BEFORE UPDATE ON public.demo_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();