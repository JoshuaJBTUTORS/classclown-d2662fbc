ALTER TABLE public.referrals ALTER COLUMN referrer_user_id DROP NOT NULL;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referrer_name text;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referrer_email text;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referrer_phone text;