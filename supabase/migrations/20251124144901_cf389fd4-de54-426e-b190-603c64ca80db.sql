-- Delete GCSE Maths Higher and Foundation lesson plans (redundant 52-week plans)
DELETE FROM public.lesson_plans 
WHERE subject IN ('GCSE Maths Higher', 'GCSE Maths Foundation');