
-- Fix trial bookings RLS policy to allow anonymous users to create bookings

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can create trial bookings" ON public.trial_bookings;

-- Create new policy allowing anonymous users to create trial bookings
CREATE POLICY "Allow anonymous users to create trial bookings" 
ON public.trial_bookings
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);
