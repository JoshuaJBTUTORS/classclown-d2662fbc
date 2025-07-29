-- Add lesson_time column to trial_bookings table to store actual lesson time
-- The preferred_time column will store the demo session time (displayed time)
-- The lesson_time column will store the actual tutor availability time (15 minutes later)

ALTER TABLE public.trial_bookings 
ADD COLUMN lesson_time TEXT;