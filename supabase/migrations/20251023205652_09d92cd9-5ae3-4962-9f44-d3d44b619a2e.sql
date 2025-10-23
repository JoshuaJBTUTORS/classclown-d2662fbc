-- Delete Fariha's stuck active assignment
DELETE FROM tutor_active_assignments
WHERE id = '729f3678-4551-42e4-8377-eb3f9b0fe4d4';

-- Update the calendar entry to approved status
UPDATE content_calendar
SET status = 'approved'
WHERE id = '3b7d611a-0991-41e1-bc7c-18c3ab065517';