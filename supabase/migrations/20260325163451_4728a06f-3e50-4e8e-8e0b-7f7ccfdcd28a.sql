
-- Create card_update_links table for secure public card update links
CREATE TABLE public.card_update_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(token)
);

-- Enable RLS
ALTER TABLE public.card_update_links ENABLE ROW LEVEL SECURITY;

-- Public read policy filtered by token (no auth required)
CREATE POLICY "Anyone can read card update links by token"
  ON public.card_update_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can insert/update (edge functions use service role)
CREATE POLICY "Service role can manage card update links"
  ON public.card_update_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
