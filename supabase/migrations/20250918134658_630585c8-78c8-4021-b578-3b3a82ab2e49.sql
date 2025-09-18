-- Create enum for topic request status
CREATE TYPE topic_request_status AS ENUM ('pending', 'approved', 'denied');

-- Create topic_requests table
CREATE TABLE public.topic_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.parents(id) ON DELETE CASCADE,
  requested_topic TEXT NOT NULL,
  status topic_request_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.topic_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for topic requests
CREATE POLICY "Students can view their own topic requests" 
ON public.topic_requests 
FOR SELECT 
USING (
  student_id = get_current_user_student_id()
);

CREATE POLICY "Parents can view their children's topic requests" 
ON public.topic_requests 
FOR SELECT 
USING (
  parent_id = get_current_user_parent_id()
  OR 
  student_id IN (
    SELECT s.id FROM public.students s 
    WHERE s.parent_id = get_current_user_parent_id()
  )
);

CREATE POLICY "Students can create topic requests for their lessons" 
ON public.topic_requests 
FOR INSERT 
WITH CHECK (
  student_id = get_current_user_student_id()
  AND EXISTS (
    SELECT 1 FROM public.lesson_students ls
    WHERE ls.lesson_id = topic_requests.lesson_id
    AND ls.student_id = topic_requests.student_id
  )
);

CREATE POLICY "Parents can create topic requests for their children's lessons" 
ON public.topic_requests 
FOR INSERT 
WITH CHECK (
  (parent_id = get_current_user_parent_id() OR student_id IN (
    SELECT s.id FROM public.students s 
    WHERE s.parent_id = get_current_user_parent_id()
  ))
  AND EXISTS (
    SELECT 1 FROM public.lesson_students ls
    WHERE ls.lesson_id = topic_requests.lesson_id
    AND ls.student_id = topic_requests.student_id
  )
);

CREATE POLICY "Admins can manage all topic requests" 
ON public.topic_requests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_topic_requests_updated_at
BEFORE UPDATE ON public.topic_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();