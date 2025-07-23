-- Remove the circular foreign key relationship from lessons to trial_bookings
-- Keep trial_bookings.lesson_id but remove lessons.trial_booking_id foreign key constraint

-- First drop the foreign key constraint
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_trial_booking_id_fkey;

-- Keep the column but remove the foreign key constraint to break the circular dependency
-- The trial_booking_id column can still be used for reference without the constraint