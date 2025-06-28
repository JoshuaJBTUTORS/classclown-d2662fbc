
-- Create storage bucket for teaching materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('teaching-materials', 'teaching-materials', true);

-- Create teaching materials table
CREATE TABLE public.teaching_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  week_number INTEGER NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'document',
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on teaching materials
ALTER TABLE public.teaching_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for teaching materials
CREATE POLICY "Admins and owners can manage all teaching materials"
  ON public.teaching_materials
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Tutors can view teaching materials"
  ON public.teaching_materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'tutor'
    )
  );

-- Storage policies for teaching materials bucket
CREATE POLICY "Admins and owners can upload teaching materials"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'teaching-materials' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Authenticated users can view teaching materials"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'teaching-materials' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Admins and owners can delete teaching materials"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'teaching-materials' AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'owner')
    )
  );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_teaching_materials_updated_at
  BEFORE UPDATE ON public.teaching_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();

-- Add indexes for performance
CREATE INDEX idx_teaching_materials_subject ON public.teaching_materials(subject);
CREATE INDEX idx_teaching_materials_week ON public.teaching_materials(week_number);
CREATE INDEX idx_teaching_materials_subject_week ON public.teaching_materials(subject, week_number);
