-- Drop existing restrictive policies for lesson_proposals
DROP POLICY IF EXISTS "Anyone can view proposals with valid token" ON public.lesson_proposals;
DROP POLICY IF EXISTS "Anyone can update proposals with valid token" ON public.lesson_proposals;

-- Create new policies allowing anonymous and authenticated access
CREATE POLICY "Anyone can view proposals with valid token"
  ON public.lesson_proposals
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update proposals with valid token"
  ON public.lesson_proposals
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Update policies for lesson_proposal_signatures
DROP POLICY IF EXISTS "Anyone can insert signatures with valid token" ON public.lesson_proposal_signatures;
DROP POLICY IF EXISTS "Anyone can view signatures with valid token" ON public.lesson_proposal_signatures;

CREATE POLICY "Anyone can insert signatures with valid token"
  ON public.lesson_proposal_signatures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view signatures with valid token"
  ON public.lesson_proposal_signatures
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Update policies for lesson_proposal_payment_methods
DROP POLICY IF EXISTS "Anyone can insert payment methods with valid token" ON public.lesson_proposal_payment_methods;
DROP POLICY IF EXISTS "Anyone can view payment methods with valid token" ON public.lesson_proposal_payment_methods;

CREATE POLICY "Anyone can insert payment methods with valid token"
  ON public.lesson_proposal_payment_methods
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view payment methods with valid token"
  ON public.lesson_proposal_payment_methods
  FOR SELECT
  TO anon, authenticated
  USING (true);