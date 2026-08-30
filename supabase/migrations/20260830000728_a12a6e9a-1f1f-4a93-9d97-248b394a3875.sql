ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.profiles SET is_active = false WHERE id IN (
  '96114d42-e217-4596-a8ea-a066869678e1',
  '03dc9d0c-2f16-4a53-944b-d25e0fc151eb',
  '1961b3e2-14b9-46d2-9b18-8be2584e7ac6',
  '8bc5d417-efaa-414a-a2de-c9e5dd78465c'
);