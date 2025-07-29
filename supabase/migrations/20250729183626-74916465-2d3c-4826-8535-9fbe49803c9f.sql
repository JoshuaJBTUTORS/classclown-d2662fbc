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

-- Insert admin data
-- First, let's create the admin users and profiles
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Joshua@jb-tutors.com', '{"first_name": "Joshua", "last_name": "Ekundayo", "role": "admin"}', now(), now(), now()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Britney@jb-tutors.com', '{"first_name": "Britney", "last_name": "Lawrence", "role": "admin"}', now(), now(), now()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Musa@jb-tutors.com', '{"first_name": "Musa", "last_name": "Thulubona", "role": "admin"}', now(), now(), now())
ON CONFLICT (email) DO NOTHING;

-- Insert profiles for admins
INSERT INTO public.profiles (id, first_name, last_name)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Joshua', 'Ekundayo'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Britney', 'Lawrence'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Musa', 'Thulubona')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Insert user roles for admins
INSERT INTO public.user_roles (user_id, role, is_primary)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'admin', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'admin', true)
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert Joshua's availability (9am-8pm GMT Monday to Sunday)
INSERT INTO public.admin_availability (admin_id, day_of_week, start_time, end_time)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 0, '09:00:00', '20:00:00'), -- Sunday
  ('550e8400-e29b-41d4-a716-446655440001', 1, '09:00:00', '20:00:00'), -- Monday
  ('550e8400-e29b-41d4-a716-446655440001', 2, '09:00:00', '20:00:00'), -- Tuesday
  ('550e8400-e29b-41d4-a716-446655440001', 3, '09:00:00', '20:00:00'), -- Wednesday
  ('550e8400-e29b-41d4-a716-446655440001', 4, '09:00:00', '20:00:00'), -- Thursday
  ('550e8400-e29b-41d4-a716-446655440001', 5, '09:00:00', '20:00:00'), -- Friday
  ('550e8400-e29b-41d4-a716-446655440001', 6, '09:00:00', '20:00:00'); -- Saturday

-- Insert Britney's availability (9am-8pm GMT Monday to Sunday)
INSERT INTO public.admin_availability (admin_id, day_of_week, start_time, end_time)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', 0, '09:00:00', '20:00:00'), -- Sunday
  ('550e8400-e29b-41d4-a716-446655440002', 1, '09:00:00', '20:00:00'), -- Monday
  ('550e8400-e29b-41d4-a716-446655440002', 2, '09:00:00', '20:00:00'), -- Tuesday
  ('550e8400-e29b-41d4-a716-446655440002', 3, '09:00:00', '20:00:00'), -- Wednesday
  ('550e8400-e29b-41d4-a716-446655440002', 4, '09:00:00', '20:00:00'), -- Thursday
  ('550e8400-e29b-41d4-a716-446655440002', 5, '09:00:00', '20:00:00'), -- Friday
  ('550e8400-e29b-41d4-a716-446655440002', 6, '09:00:00', '20:00:00'); -- Saturday

-- Insert Musa's availability (12pm-8pm GMT Monday to Friday)
INSERT INTO public.admin_availability (admin_id, day_of_week, start_time, end_time)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440003', 1, '12:00:00', '20:00:00'), -- Monday
  ('550e8400-e29b-41d4-a716-446655440003', 2, '12:00:00', '20:00:00'), -- Tuesday
  ('550e8400-e29b-41d4-a716-446655440003', 3, '12:00:00', '20:00:00'), -- Wednesday
  ('550e8400-e29b-41d4-a716-446655440003', 4, '12:00:00', '20:00:00'), -- Thursday
  ('550e8400-e29b-41d4-a716-446655440003', 5, '12:00:00', '20:00:00'); -- Friday