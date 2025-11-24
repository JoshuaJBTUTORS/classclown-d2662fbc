-- Remove duplicate trigger that's causing conflicts during parent account creation
DROP TRIGGER IF EXISTS on_profile_created_initialize_quota ON public.profiles;