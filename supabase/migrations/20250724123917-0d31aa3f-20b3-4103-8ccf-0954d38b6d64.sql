-- Enable RLS on time_off_requests table
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_off_requests table
CREATE POLICY "Admins and owners can manage all time off requests" 
ON public.time_off_requests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Tutors can manage their own time off requests" 
ON public.time_off_requests 
FOR ALL 
USING (tutor_id = get_current_user_tutor_id());

CREATE POLICY "Tutors can view their own time off requests" 
ON public.time_off_requests 
FOR SELECT 
USING (tutor_id = get_current_user_tutor_id());