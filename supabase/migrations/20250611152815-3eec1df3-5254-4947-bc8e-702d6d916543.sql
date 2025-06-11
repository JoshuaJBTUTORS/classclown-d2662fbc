
-- Add new fields to trial_bookings table for enhanced approval workflow
ALTER TABLE public.trial_bookings 
ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.lessons(id),
ADD COLUMN IF NOT EXISTS assigned_tutor_id uuid REFERENCES public.tutors(id),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Add account_type and trial_status fields to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'regular' CHECK (account_type IN ('regular', 'trial', 'prospect')),
ADD COLUMN IF NOT EXISTS trial_status text;

-- Add account_type field to parents table
ALTER TABLE public.parents 
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'regular' CHECK (account_type IN ('regular', 'trial', 'prospect'));

-- Add lesson_type and trial_booking_id fields to lessons table
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS lesson_type text DEFAULT 'regular' CHECK (lesson_type IN ('regular', 'trial', 'makeup')),
ADD COLUMN IF NOT EXISTS trial_booking_id uuid REFERENCES public.trial_bookings(id);

-- Create index for better performance on trial-related queries
CREATE INDEX IF NOT EXISTS idx_students_account_type ON public.students(account_type);
CREATE INDEX IF NOT EXISTS idx_parents_account_type ON public.parents(account_type);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_type ON public.lessons(lesson_type);
CREATE INDEX IF NOT EXISTS idx_trial_bookings_status ON public.trial_bookings(status);
