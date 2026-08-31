CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.uk_schools (
  urn integer PRIMARY KEY,
  name text NOT NULL,
  town text,
  postcode text,
  local_authority text,
  phase text,
  establishment_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.uk_schools TO anon;
GRANT SELECT ON public.uk_schools TO authenticated;
GRANT ALL ON public.uk_schools TO service_role;

ALTER TABLE public.uk_schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read UK schools" ON public.uk_schools FOR SELECT USING (true);

CREATE INDEX uk_schools_name_trgm ON public.uk_schools USING gin (name gin_trgm_ops);
CREATE INDEX uk_schools_town_trgm ON public.uk_schools USING gin (town gin_trgm_ops);
CREATE INDEX uk_schools_postcode_idx ON public.uk_schools (postcode);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_urn text;