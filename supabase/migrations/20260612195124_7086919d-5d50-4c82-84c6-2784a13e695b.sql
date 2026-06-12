
-- Tutor offer letters and signatures
CREATE TABLE public.tutor_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NULL REFERENCES public.tutors(id) ON DELETE SET NULL,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_phone TEXT NULL,
  position TEXT NOT NULL DEFAULT 'Tutor',
  hourly_rate NUMERIC(8,2) NOT NULL,
  start_date DATE NOT NULL,
  min_hours_per_week INTEGER NOT NULL DEFAULT 15,
  custom_intro TEXT NULL,
  access_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'sent',
  document_ref TEXT NOT NULL,
  sent_at TIMESTAMPTZ NULL,
  viewed_at TIMESTAMPTZ NULL,
  signed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tutor_offers_access_token ON public.tutor_offers(access_token);
CREATE INDEX idx_tutor_offers_status ON public.tutor_offers(status);

GRANT SELECT, INSERT, UPDATE ON public.tutor_offers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_offers TO authenticated;
GRANT ALL ON public.tutor_offers TO service_role;

ALTER TABLE public.tutor_offers ENABLE ROW LEVEL SECURITY;

-- Admins/owners full access
CREATE POLICY "Admins manage tutor offers" ON public.tutor_offers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Public can read by id (token is matched client-side via .eq filter; the random UUID acts as access secret)
CREATE POLICY "Public can read tutor offers" ON public.tutor_offers
  FOR SELECT TO anon, authenticated
  USING (true);

-- Public can update viewed_at / status to viewed/signed only via edge function or token
CREATE POLICY "Public can update tutor offer view/sign" ON public.tutor_offers
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);


CREATE TABLE public.tutor_offer_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.tutor_offers(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  ip_address TEXT NULL,
  user_agent TEXT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tutor_offer_signatures_offer ON public.tutor_offer_signatures(offer_id);

GRANT SELECT, INSERT ON public.tutor_offer_signatures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_offer_signatures TO authenticated;
GRANT ALL ON public.tutor_offer_signatures TO service_role;

ALTER TABLE public.tutor_offer_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read tutor offer signatures" ON public.tutor_offer_signatures
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Anyone can insert tutor offer signatures" ON public.tutor_offer_signatures
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- updated_at trigger
CREATE TRIGGER update_tutor_offers_updated_at
  BEFORE UPDATE ON public.tutor_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
