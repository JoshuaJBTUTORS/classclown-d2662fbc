
-- Start transaction
BEGIN;

-- Verify we're not in production (safety check)
DO $$ 
BEGIN
  IF current_database() = 'production' THEN
    RAISE EXCEPTION 'Cannot run data cleanup in production';
  END IF;
END $$;

-- 1. Start with child tables that depend on lessons, students, tutors, etc.
-- We'll add CASCADE to handle dependencies automatically

-- Clear homework-related data
DELETE FROM public.homework_submissions CASCADE;
DELETE FROM public.homework CASCADE;

-- Clear lesson-related junction tables and dependencies
DELETE FROM public.lesson_attendance CASCADE;
DELETE FROM public.lesson_plan_assignments CASCADE;
DELETE FROM public.lesson_students CASCADE;
DELETE FROM public.recurring_lesson_groups CASCADE;

-- Clear revision-related data
DELETE FROM public.revision_progress CASCADE;
DELETE FROM public.revision_sessions CASCADE;
DELETE FROM public.revision_schedules CASCADE;

-- Clear assessment-related data
DELETE FROM public.student_responses CASCADE;
DELETE FROM public.assessment_improvements CASCADE;
DELETE FROM public.assessment_sessions CASCADE;
DELETE FROM public.assessment_questions CASCADE;
DELETE FROM public.ai_assessments CASCADE;

-- Clear course-related data
DELETE FROM public.student_progress CASCADE;
DELETE FROM public.course_notes CASCADE;
DELETE FROM public.course_purchases CASCADE;
DELETE FROM public.course_lessons CASCADE;
DELETE FROM public.course_modules CASCADE;
DELETE FROM public.courses CASCADE;

-- 2. Now clear main entity tables
DELETE FROM public.trial_bookings CASCADE;
DELETE FROM public.lessons CASCADE;
DELETE FROM public.lesson_plans CASCADE;
DELETE FROM public.students CASCADE;
DELETE FROM public.parents CASCADE;
DELETE FROM public.tutors CASCADE;

-- 3. Verify deletions
DO $$ 
DECLARE
    table_counts RECORD;
BEGIN
    FOR table_counts IN (
        SELECT 
            (SELECT COUNT(*) FROM public.homework_submissions) as homework_submissions,
            (SELECT COUNT(*) FROM public.homework) as homework,
            (SELECT COUNT(*) FROM public.lessons) as lessons,
            (SELECT COUNT(*) FROM public.students) as students,
            (SELECT COUNT(*) FROM public.tutors) as tutors
    ) LOOP
        IF table_counts.homework_submissions > 0 
           OR table_counts.homework > 0 
           OR table_counts.lessons > 0 
           OR table_counts.students > 0 
           OR table_counts.tutors > 0 THEN
            RAISE EXCEPTION 'Data deletion incomplete. Some records remain.';
        END IF;
    END LOOP;
END $$;

-- If we reach this point, all deletions were successful
COMMIT;
