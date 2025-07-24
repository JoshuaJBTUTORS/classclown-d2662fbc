-- Remove the module_assessments table as it's no longer needed
-- We're now using content_type = 'ai-assessment' in course_lessons instead

DROP TABLE IF EXISTS public.module_assessments;