CREATE UNIQUE INDEX IF NOT EXISTS students_unique_child_per_parent
ON public.students (parent_id, lower(btrim(first_name)), lower(btrim(coalesce(last_name, ''))))
WHERE parent_id IS NOT NULL;