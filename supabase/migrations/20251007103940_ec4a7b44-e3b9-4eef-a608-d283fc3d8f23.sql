-- Fix RLS policies that reference auth.users directly to prevent permission errors

-- Drop existing policies on content_calendar
DROP POLICY IF EXISTS "Content tutors can view their assignments" ON public.content_calendar;

-- Recreate policy using security definer function
CREATE POLICY "Content tutors can view their assignments" 
ON public.content_calendar
FOR SELECT 
USING (
  assigned_tutor_id = public.get_current_user_tutor_id()
);

-- Drop and recreate policies on content_videos
DROP POLICY IF EXISTS "Tutors can view their own videos" ON public.content_videos;
DROP POLICY IF EXISTS "Tutors can upload their own videos" ON public.content_videos;

CREATE POLICY "Tutors can view their own videos" 
ON public.content_videos
FOR SELECT 
USING (
  tutor_id = public.get_current_user_tutor_id()
);

CREATE POLICY "Tutors can upload their own videos" 
ON public.content_videos
FOR INSERT 
WITH CHECK (
  tutor_id = public.get_current_user_tutor_id()
);

-- Drop and recreate policy on content_tutors
DROP POLICY IF EXISTS "Content tutors can view their own profile" ON public.content_tutors;

CREATE POLICY "Content tutors can view their own profile" 
ON public.content_tutors
FOR SELECT 
USING (
  tutor_id = public.get_current_user_tutor_id()
);