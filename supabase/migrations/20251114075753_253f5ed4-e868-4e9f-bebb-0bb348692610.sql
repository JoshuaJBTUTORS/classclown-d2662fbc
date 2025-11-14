-- Add feature flag to profiles table for Cleo hub access control
ALTER TABLE public.profiles 
ADD COLUMN has_cleo_hub_access BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX idx_profiles_cleo_access ON public.profiles(has_cleo_hub_access);

-- Set learning_hub_only users to have access by default (they're already restricted to hub)
UPDATE public.profiles 
SET has_cleo_hub_access = true
WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'learning_hub_only'
);

-- Function to toggle Cleo hub access for a user (admin-only)
CREATE OR REPLACE FUNCTION public.toggle_cleo_hub_access(
  target_user_id uuid,
  enable_access boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins/owners can toggle
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can modify hub access';
  END IF;

  UPDATE public.profiles
  SET has_cleo_hub_access = enable_access
  WHERE id = target_user_id;
END;
$$;