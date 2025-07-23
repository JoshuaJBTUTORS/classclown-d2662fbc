
-- Add SELECT policy for anonymous users on trial_bookings table
CREATE POLICY "Allow anonymous users to view trial bookings" 
ON public.trial_bookings
FOR SELECT 
TO authenticated, anon
USING (true);
