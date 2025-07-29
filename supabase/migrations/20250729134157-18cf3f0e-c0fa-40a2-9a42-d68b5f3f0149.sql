-- Create enum types for school progress
CREATE TYPE progress_file_type AS ENUM ('report_card', 'mock_exam', 'other');
CREATE TYPE progress_file_format AS ENUM ('pdf', 'image');

-- Create school_progress table
CREATE TABLE public.school_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id INTEGER NOT NULL,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type progress_file_type NOT NULL DEFAULT 'other',
  file_format progress_file_format NOT NULL,
  description TEXT,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  academic_year TEXT,
  term TEXT,
  subject TEXT,
  grade_achieved TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_school_progress_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
  CONSTRAINT fk_school_progress_uploader FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.school_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Students can view their own progress" 
ON public.school_progress 
FOR SELECT 
USING (
  student_id = get_current_user_student_id()
  OR uploaded_by = auth.uid()
);

CREATE POLICY "Parents can view their children's progress" 
ON public.school_progress 
FOR SELECT 
USING (
  student_id IN (
    SELECT s.id FROM public.students s 
    WHERE s.parent_id = get_current_user_parent_id()
  )
);

CREATE POLICY "Admins can view all progress" 
ON public.school_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

CREATE POLICY "Students can upload their own progress" 
ON public.school_progress 
FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid()
  AND (
    student_id = get_current_user_student_id()
    OR student_id IN (
      SELECT s.id FROM public.students s 
      WHERE s.parent_id = get_current_user_parent_id()
    )
  )
);

CREATE POLICY "Users can update their own uploads" 
ON public.school_progress 
FOR UPDATE 
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own uploads" 
ON public.school_progress 
FOR DELETE 
USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can manage all progress" 
ON public.school_progress 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create storage bucket for school progress files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('school-progress', 'school-progress', true);

-- Create storage policies
CREATE POLICY "Users can view progress files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'school-progress');

CREATE POLICY "Authenticated users can upload progress files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'school-progress' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own progress files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'school-progress' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own progress files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'school-progress' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for updated_at
CREATE TRIGGER update_school_progress_updated_at
  BEFORE UPDATE ON public.school_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_school_progress_student_id ON public.school_progress(student_id);
CREATE INDEX idx_school_progress_uploaded_by ON public.school_progress(uploaded_by);
CREATE INDEX idx_school_progress_upload_date ON public.school_progress(upload_date DESC);
CREATE INDEX idx_school_progress_file_type ON public.school_progress(file_type);