-- Create assessment_assignments table for tracking assigned papers to students
CREATE TABLE public.assessment_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.ai_assessments(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'reviewed')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessment_assignments ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_assessment_assignments_assigned_to ON public.assessment_assignments(assigned_to);
CREATE INDEX idx_assessment_assignments_assessment_id ON public.assessment_assignments(assessment_id);
CREATE INDEX idx_assessment_assignments_status ON public.assessment_assignments(status);

-- RLS Policies

-- Admins and owners can view all assignments
CREATE POLICY "Admins can view all assignments"
ON public.assessment_assignments
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Admins and owners can create assignments
CREATE POLICY "Admins can create assignments"
ON public.assessment_assignments
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Admins and owners can update any assignment
CREATE POLICY "Admins can update all assignments"
ON public.assessment_assignments
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Admins and owners can delete assignments
CREATE POLICY "Admins can delete assignments"
ON public.assessment_assignments
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Students/Parents can view their own assignments
CREATE POLICY "Users can view their own assignments"
ON public.assessment_assignments
FOR SELECT
USING (auth.uid() = assigned_to);

-- Students/Parents can update their own assignments (for status changes)
CREATE POLICY "Users can update their own assignments"
ON public.assessment_assignments
FOR UPDATE
USING (auth.uid() = assigned_to)
WITH CHECK (auth.uid() = assigned_to);

-- Trigger for updated_at
CREATE TRIGGER update_assessment_assignments_updated_at
BEFORE UPDATE ON public.assessment_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();