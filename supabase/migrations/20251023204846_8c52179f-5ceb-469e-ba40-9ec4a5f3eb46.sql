-- Remove UNIQUE constraint on tutor_id to allow multiple assignments
ALTER TABLE public.tutor_active_assignments 
DROP CONSTRAINT IF EXISTS tutor_active_assignments_tutor_id_key;

-- Update RLS policy to allow multiple requests
DROP POLICY IF EXISTS "Tutors can insert requests if no active assignment" ON public.video_requests;

CREATE POLICY "Tutors can insert video requests"
ON public.video_requests FOR INSERT
WITH CHECK (tutor_id = get_current_user_tutor_id());

-- Create index for better performance with multiple assignments
CREATE INDEX IF NOT EXISTS idx_tutor_active_assignments_tutor_calendar 
ON public.tutor_active_assignments(tutor_id, calendar_entry_id);

-- Create function to cleanup active assignments when video is approved or rejected
CREATE OR REPLACE FUNCTION public.cleanup_active_assignment_on_video_status()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When video is approved or rejected, remove the active assignment
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'uploaded' THEN
    DELETE FROM public.tutor_active_assignments
    WHERE calendar_entry_id = NEW.calendar_entry_id
    AND tutor_id = NEW.tutor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically cleanup active assignments
DROP TRIGGER IF EXISTS cleanup_active_assignment_trigger ON public.content_videos;
CREATE TRIGGER cleanup_active_assignment_trigger
AFTER UPDATE ON public.content_videos
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_active_assignment_on_video_status();