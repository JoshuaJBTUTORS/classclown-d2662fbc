-- Create topic_requests table
CREATE TABLE public.topic_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id INTEGER NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  lesson_id UUID NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  requested_topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID NULL REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE NULL
);

-- Enable RLS
ALTER TABLE public.topic_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Students can create their own topic requests"
ON public.topic_requests
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = get_current_user_student_id() 
  OR parent_id = get_current_user_parent_id()
);

CREATE POLICY "Students and parents can view their own topic requests"
ON public.topic_requests
FOR SELECT
TO authenticated
USING (
  student_id = get_current_user_student_id()
  OR parent_id = get_current_user_parent_id()
  OR student_id IN (
    SELECT s.id FROM public.students s 
    WHERE s.parent_id = get_current_user_parent_id()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);

CREATE POLICY "Admins can manage all topic requests"
ON public.topic_requests
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner')
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_topic_requests_updated_at
  BEFORE UPDATE ON public.topic_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();