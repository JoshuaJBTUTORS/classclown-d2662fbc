-- Fix existing lesson times that were incorrectly stored as UK time but labeled as UTC
-- This converts the stored times (which are actually UK time) to proper UTC

UPDATE lessons 
SET 
  start_time = start_time AT TIME ZONE 'Europe/London' AT TIME ZONE 'UTC',
  end_time = end_time AT TIME ZONE 'Europe/London' AT TIME ZONE 'UTC'
WHERE start_time IS NOT NULL 
  AND end_time IS NOT NULL;