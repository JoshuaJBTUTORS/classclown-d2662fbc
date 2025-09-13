-- Add 'scheduled' as a valid attendance status option
ALTER TABLE public.lesson_attendance 
DROP CONSTRAINT IF EXISTS lesson_attendance_attendance_status_check;

ALTER TABLE public.lesson_attendance 
ADD CONSTRAINT lesson_attendance_attendance_status_check 
CHECK (attendance_status IN ('attended', 'absent', 'late', 'excused', 'scheduled'));