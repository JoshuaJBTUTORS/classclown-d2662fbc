-- Fix critical security issues by enabling RLS on tables that have policies but RLS disabled

-- Enable RLS on tutors table (already has policies)
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lesson_students table (already has policies) 
ALTER TABLE public.lesson_students ENABLE ROW LEVEL SECURITY;

-- Enable RLS on lessons table (already has policies)
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;