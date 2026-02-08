
-- Replace the text column with proper columns for checkbox + file upload
ALTER TABLE public.homework DROP COLUMN IF EXISTS additional_resources;
ALTER TABLE public.homework ADD COLUMN additional_resources_required boolean NOT NULL DEFAULT false;
ALTER TABLE public.homework ADD COLUMN additional_resources_url text;
ALTER TABLE public.homework ADD COLUMN additional_resources_type text;
