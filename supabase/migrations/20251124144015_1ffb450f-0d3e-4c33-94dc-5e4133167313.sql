-- Grant Cleo Hub access to all tutors
UPDATE public.profiles
SET has_cleo_hub_access = true
WHERE id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'tutor'
);