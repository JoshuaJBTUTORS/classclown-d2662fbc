ALTER TABLE public.referral_codes ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.referral_codes
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_email text;

CREATE UNIQUE INDEX IF NOT EXISTS referral_codes_guest_email_unique
  ON public.referral_codes (lower(guest_email))
  WHERE user_id IS NULL;

ALTER TABLE public.referral_codes
  ADD CONSTRAINT referral_codes_owner_present
  CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);

GRANT ALL ON public.referral_codes TO service_role;