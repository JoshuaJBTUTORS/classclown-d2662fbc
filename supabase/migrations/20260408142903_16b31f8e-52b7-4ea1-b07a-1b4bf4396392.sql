
CREATE TABLE public.homework_completion_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('completed', 'not_completed', 'excused')),
  marked_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(homework_id, student_id)
);

ALTER TABLE public.homework_completion_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutors/admins/owners can view completion status"
ON public.homework_completion_status
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'tutor') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'owner')
);

CREATE POLICY "Tutors/admins/owners can insert completion status"
ON public.homework_completion_status
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = marked_by AND (
    public.has_role(auth.uid(), 'tutor') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'owner')
  )
);

CREATE POLICY "Tutors/admins/owners can update completion status"
ON public.homework_completion_status
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'tutor') OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'owner')
);
