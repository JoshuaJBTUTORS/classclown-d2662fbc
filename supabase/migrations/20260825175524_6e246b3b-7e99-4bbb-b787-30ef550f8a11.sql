CREATE TABLE public.lesson_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  uploaded_by uuid,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lesson_resources_lesson_id ON public.lesson_resources(lesson_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_resources TO authenticated;
GRANT ALL ON public.lesson_resources TO service_role;

ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view lesson resources"
ON public.lesson_resources FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Staff can add lesson resources"
ON public.lesson_resources FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Staff can update lesson resources"
ON public.lesson_resources FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Staff can delete lesson resources"
ON public.lesson_resources FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_lesson_resources_updated_at
BEFORE UPDATE ON public.lesson_resources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Staff can read lesson resource files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lesson-resources' AND (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')));

CREATE POLICY "Staff can upload lesson resource files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lesson-resources' AND (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')));

CREATE POLICY "Staff can delete lesson resource files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lesson-resources' AND (public.has_role(auth.uid(), 'tutor') OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')));