-- Update the handle_new_user function to prioritize role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public 
AS $$
DECLARE
  user_role public.app_role;
  user_email text;
  metadata_role text;
BEGIN
  -- Get the user's email
  user_email := NEW.email;
  
  -- First, check if role is explicitly set in metadata
  metadata_role := NEW.raw_user_meta_data->>'role';
  
  IF metadata_role IS NOT NULL THEN
    -- Use the role from metadata if it's valid
    BEGIN
      user_role := metadata_role::public.app_role;
    EXCEPTION WHEN others THEN
      -- If invalid role in metadata, fall back to email-based logic
      user_role := NULL;
    END;
  END IF;
  
  -- If no valid role from metadata, use email-based logic
  IF user_role IS NULL THEN
    -- Check if this user exists in the students table
    IF EXISTS (SELECT 1 FROM public.students WHERE email = user_email) THEN
      user_role := 'student'::public.app_role;
    ELSE
      -- Default to parent for new users
      user_role := 'parent'::public.app_role;
    END IF;
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Assign role as primary
  INSERT INTO public.user_roles (user_id, role, is_primary)
  VALUES (NEW.id, user_role, true);
  
  RETURN NEW;
END;
$$;