CREATE OR REPLACE FUNCTION public.list_teaching_material_test_names(_limit integer DEFAULT 500)
RETURNS TABLE(name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT o.name FROM storage.objects o
  WHERE o.bucket_id = 'teaching-materials' AND o.name LIKE 'test/%'
  LIMIT _limit;
$$;

REVOKE ALL ON FUNCTION public.list_teaching_material_test_names(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_teaching_material_test_names(integer) TO service_role;