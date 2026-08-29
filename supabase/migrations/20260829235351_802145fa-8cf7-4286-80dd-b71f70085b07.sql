ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;

UPDATE public.profiles SET job_title = 'Head of Growth'
  WHERE lower(first_name) = 'britney' AND lower(last_name) = 'lawrence';
UPDATE public.profiles SET job_title = 'CEO'
  WHERE lower(first_name) = 'joshua' AND lower(last_name) = 'ekundayo';
UPDATE public.profiles SET job_title = 'Customer Success Specialist'
  WHERE lower(first_name) = 'hannah' AND lower(last_name) = 'murray';
UPDATE public.profiles SET job_title = 'Sales Development Representative'
  WHERE lower(first_name) = 'musa' AND lower(last_name) = 'thulebona';