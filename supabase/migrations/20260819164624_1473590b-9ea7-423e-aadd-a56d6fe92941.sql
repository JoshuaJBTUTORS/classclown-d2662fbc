CREATE TABLE public.lesson_revision_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id bigint NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'transcript',
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, student_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_revision_notes TO authenticated;
GRANT ALL ON public.lesson_revision_notes TO service_role;

ALTER TABLE public.lesson_revision_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view revision notes for accessible lessons"
ON public.lesson_revision_notes FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM lessons l JOIN user_roles ur ON ur.user_id = auth.uid()
  WHERE l.id = lesson_revision_notes.lesson_id
    AND (
      ur.role = ANY (ARRAY['admin'::app_role, 'owner'::app_role])
      OR (ur.role = 'tutor'::app_role AND l.tutor_id = get_current_user_tutor_id())
      OR (ur.role = ANY (ARRAY['student'::app_role, 'parent'::app_role]) AND (
            lesson_revision_notes.student_id = get_current_user_student_id()
            OR lesson_revision_notes.student_id IN (SELECT s.id FROM students s WHERE s.parent_id = get_current_user_parent_id())
      ))
    )
));

CREATE POLICY "Admins and tutors can manage revision notes"
ON public.lesson_revision_notes FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM lessons l JOIN user_roles ur ON ur.user_id = auth.uid()
  WHERE l.id = lesson_revision_notes.lesson_id
    AND (ur.role = ANY (ARRAY['admin'::app_role, 'owner'::app_role])
         OR (ur.role = 'tutor'::app_role AND l.tutor_id = get_current_user_tutor_id()))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM lessons l JOIN user_roles ur ON ur.user_id = auth.uid()
  WHERE l.id = lesson_revision_notes.lesson_id
    AND (ur.role = ANY (ARRAY['admin'::app_role, 'owner'::app_role])
         OR (ur.role = 'tutor'::app_role AND l.tutor_id = get_current_user_tutor_id()))
));

CREATE TRIGGER update_lesson_revision_notes_updated_at
BEFORE UPDATE ON public.lesson_revision_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();