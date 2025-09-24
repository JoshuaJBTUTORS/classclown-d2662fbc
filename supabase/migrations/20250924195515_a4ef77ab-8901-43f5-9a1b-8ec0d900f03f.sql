-- Add complimentary access flag to parents table
ALTER TABLE public.parents 
ADD COLUMN has_complimentary_access boolean NOT NULL DEFAULT false;