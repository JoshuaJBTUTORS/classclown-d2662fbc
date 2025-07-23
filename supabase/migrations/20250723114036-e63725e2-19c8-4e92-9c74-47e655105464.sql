
-- Update RLS policies to allow anonymous users to view data needed for trial booking

-- 1. Update tutors table policy to allow anonymous users to view basic tutor information
DROP POLICY IF EXISTS "Allow authenticated users to view tutors" ON public.tutors;
CREATE POLICY "Allow authenticated and anonymous users to view tutors" 
ON public.tutors
FOR SELECT 
TO authenticated, anon
USING (true);

-- 2. Update tutor_subjects table policy to allow anonymous users to see tutor-subject associations
DROP POLICY IF EXISTS "Allow authenticated users to view tutor_subjects" ON public.tutor_subjects;
CREATE POLICY "Allow authenticated and anonymous users to view tutor_subjects" 
ON public.tutor_subjects
FOR SELECT 
TO authenticated, anon
USING (true);

-- 3. Update tutor_availability table policy to allow anonymous users to view availability schedules
DROP POLICY IF EXISTS "Allow authenticated users to view tutor_availability" ON public.tutor_availability;
CREATE POLICY "Allow authenticated and anonymous users to view tutor_availability" 
ON public.tutor_availability
FOR SELECT 
TO authenticated, anon
USING (true);

-- 4. Update lessons table policy to allow anonymous users to check for existing lesson conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view lessons" ON public.lessons;
CREATE POLICY "Allow authenticated and anonymous users to view lessons" 
ON public.lessons
FOR SELECT 
TO authenticated, anon
USING (true);
