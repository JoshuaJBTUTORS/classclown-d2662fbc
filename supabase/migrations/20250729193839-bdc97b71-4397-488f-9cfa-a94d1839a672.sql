-- Add foreign key constraints for demo_sessions table

-- Add foreign key constraint from demo_sessions.lesson_id to lessons.id
ALTER TABLE public.demo_sessions 
ADD CONSTRAINT demo_sessions_lesson_id_fkey 
FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Add foreign key constraint from demo_sessions.admin_id to profiles.id
ALTER TABLE public.demo_sessions 
ADD CONSTRAINT demo_sessions_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES public.profiles(id) ON DELETE CASCADE;