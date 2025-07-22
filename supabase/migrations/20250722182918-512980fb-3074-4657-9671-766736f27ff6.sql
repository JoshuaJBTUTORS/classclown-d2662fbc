
-- Start transaction
BEGIN;

-- First, break circular reference by nullifying trial_booking_id in lessons
UPDATE public.lessons 
SET trial_booking_id = NULL 
WHERE trial_booking_id IS NOT NULL;

-- Clear lesson-related junction tables first
DELETE FROM public.lesson_attendance;
DELETE FROM public.lesson_plan_assignments;
DELETE FROM public.lesson_students;
DELETE FROM public.recurring_lesson_groups;
DELETE FROM public.homework_submissions;
DELETE FROM public.homework;

-- Now delete the lessons
DELETE FROM public.lessons;

-- Finally delete trial bookings
DELETE FROM public.trial_bookings;

-- Verify deletion
DO $$ 
DECLARE
    lesson_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO lesson_count FROM public.lessons;
    IF lesson_count > 0 THEN
        RAISE EXCEPTION 'Lesson deletion failed. % lessons remain.', lesson_count;
    END IF;
END $$;

COMMIT;
