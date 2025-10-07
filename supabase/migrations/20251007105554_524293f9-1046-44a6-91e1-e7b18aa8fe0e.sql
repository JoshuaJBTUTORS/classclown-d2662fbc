-- Step 1: Remove duplicate entries (keep only video_number 1-10 per subject per month)
DELETE FROM public.content_calendar
WHERE video_number > 10;

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE public.content_calendar
ADD CONSTRAINT content_calendar_subject_month_title_unique 
UNIQUE (subject, month, title);