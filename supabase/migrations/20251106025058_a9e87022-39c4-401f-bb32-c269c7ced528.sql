-- Drop the broken function that references the deleted module_assessments table
DROP FUNCTION IF EXISTS public.can_progress_to_module(UUID, UUID);