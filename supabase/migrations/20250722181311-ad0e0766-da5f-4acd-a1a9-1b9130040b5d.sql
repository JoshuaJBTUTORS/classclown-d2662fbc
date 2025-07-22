
-- IMPORTANT: This SQL script deletes data from your database
-- This is meant for test environments only!
-- Data deletion is permanent and cannot be undone

-- 1. Start with child tables that depend on lessons, students, tutors, etc.

-- Clear homework submissions first (depends on homework)
DELETE FROM public.homework_submissions;

-- Clear homework (depends on lessons)
DELETE FROM public.homework;

-- Clear document conversions
DELETE FROM public.document_conversions;

-- Clear whiteboard files
DELETE FROM public.whiteboard_files;

-- Clear lesson attendance records
DELETE FROM public.lesson_attendance;

-- Clear lesson plan assignments
DELETE FROM public.lesson_plan_assignments;

-- Clear lesson students junction table
DELETE FROM public.lesson_students;

-- Clear recurring lesson groups
DELETE FROM public.recurring_lesson_groups;

-- Clear revision data
DELETE FROM public.revision_progress;
DELETE FROM public.revision_sessions;
DELETE FROM public.revision_schedules;

-- Clear assessment data
DELETE FROM public.student_responses;
DELETE FROM public.assessment_improvements;
DELETE FROM public.assessment_sessions;
DELETE FROM public.assessment_questions;
DELETE FROM public.ai_assessments;

-- Clear course-related data
DELETE FROM public.student_progress;
DELETE FROM public.course_notes;
DELETE FROM public.course_purchases;
DELETE FROM public.course_lessons;
DELETE FROM public.course_modules;
DELETE FROM public.courses;

-- 2. Now clear main entity tables

-- Clear trial bookings
DELETE FROM public.trial_bookings;

-- Clear lessons (after all dependencies are removed)
DELETE FROM public.lessons;

-- Clear lesson plans
DELETE FROM public.lesson_plans;

-- Clear students (keep the ones needed for account testing if appropriate)
-- DELETE FROM public.students WHERE email != 'learninghub@gmail.com';
DELETE FROM public.students;

-- Clear parents
DELETE FROM public.parents;

-- Clear tutors
DELETE FROM public.tutors;

-- Clear organizations (optional - be careful with this if you have organization data you want to keep)
-- DELETE FROM public.organizations;

-- 3. We're keeping these tables intact:
-- - profiles (needed for user accounts)
-- - user_roles (needed for permissions)
-- - subjects (reference data)
-- - year_groups (reference data)
-- - any auth tables (handled by Supabase)
