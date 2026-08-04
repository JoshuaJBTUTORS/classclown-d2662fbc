CREATE TABLE public.stripe_customer_monthly_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account TEXT NOT NULL CHECK (account IN ('main','proposal')),
  stripe_customer_id TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  month DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'gbp',
  invoice_count INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT stripe_customer_monthly_revenue_unique UNIQUE (account, stripe_customer_id, month)
);

CREATE INDEX idx_scmr_month ON public.stripe_customer_monthly_revenue (month);
CREATE INDEX idx_scmr_account_month ON public.stripe_customer_monthly_revenue (account, month);

GRANT SELECT ON public.stripe_customer_monthly_revenue TO authenticated;
GRANT ALL ON public.stripe_customer_monthly_revenue TO service_role;

ALTER TABLE public.stripe_customer_monthly_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stripe monthly revenue"
ON public.stripe_customer_monthly_revenue
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_scmr_updated_at
BEFORE UPDATE ON public.stripe_customer_monthly_revenue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.stripe_revenue_sync_state (
  account TEXT NOT NULL PRIMARY KEY CHECK (account IN ('main','proposal')),
  backfilled_through TIMESTAMP WITH TIME ZONE,
  earliest_seen TIMESTAMP WITH TIME ZONE,
  backfill_complete BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'idle',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.stripe_revenue_sync_state TO authenticated;
GRANT ALL ON public.stripe_revenue_sync_state TO service_role;

ALTER TABLE public.stripe_revenue_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stripe sync state"
ON public.stripe_revenue_sync_state
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE TRIGGER update_srss_updated_at
BEFORE UPDATE ON public.stripe_revenue_sync_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();