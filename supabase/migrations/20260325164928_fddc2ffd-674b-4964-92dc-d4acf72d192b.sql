CREATE TABLE public.card_update_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text NOT NULL,
  stripe_payment_method_id text NOT NULL,
  stripe_setup_intent_id text NOT NULL,
  card_last4 text,
  card_brand text,
  card_exp_month integer,
  card_exp_year integer,
  billing_name text NOT NULL,
  billing_email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.card_update_submissions ENABLE ROW LEVEL SECURITY;