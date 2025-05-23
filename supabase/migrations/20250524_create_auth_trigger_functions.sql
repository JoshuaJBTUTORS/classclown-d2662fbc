
-- Function to check if a trigger exists
CREATE OR REPLACE FUNCTION public.check_trigger_exists(trigger_name text)
RETURNS jsonb AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = trigger_name
  ) INTO result;
  
  RETURN jsonb_build_object('exists', result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the auth user trigger
CREATE OR REPLACE FUNCTION public.create_auth_user_trigger()
RETURNS jsonb AS $$
BEGIN
  -- Drop the trigger if it exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create the trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  
  RETURN jsonb_build_object('success', true, 'message', 'Auth trigger created successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
