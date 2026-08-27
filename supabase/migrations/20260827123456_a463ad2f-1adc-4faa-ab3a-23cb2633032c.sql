UPDATE public.tutors
SET email = lower(btrim(email)),
    first_name = btrim(first_name),
    last_name = btrim(last_name)
WHERE email IS DISTINCT FROM lower(btrim(email))
   OR first_name IS DISTINCT FROM btrim(first_name)
   OR last_name IS DISTINCT FROM btrim(last_name);