-- Fix invalid email address in trial_bookings table
UPDATE public.trial_bookings 
SET email = 'trialtest@gmail.com' 
WHERE email = 'trialtest.@gmail.com';