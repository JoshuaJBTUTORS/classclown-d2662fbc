CREATE TABLE IF NOT EXISTS public.students_archive_2026_08 (
  archived_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL DEFAULT 'duplicate cleanup',
  student_id bigint NOT NULL,
  row_data jsonb NOT NULL
);

GRANT ALL ON public.students_archive_2026_08 TO service_role;

ALTER TABLE public.students_archive_2026_08 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and admins can view student archive"
ON public.students_archive_2026_08
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));