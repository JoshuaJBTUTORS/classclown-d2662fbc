-- Add booking source and uniqueness tracking to trial_bookings table
ALTER TABLE public.trial_bookings 
ADD COLUMN booking_source text DEFAULT 'general',
ADD COLUMN is_unique_booking boolean DEFAULT true;

-- Create admin earnings goals table
CREATE TABLE public.admin_earning_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_amount integer NOT NULL,
  period text NOT NULL CHECK (period IN ('weekly', 'monthly')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin earning goals
ALTER TABLE public.admin_earning_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for admin earning goals
CREATE POLICY "Admins can manage their own goals" 
ON public.admin_earning_goals 
FOR ALL 
USING (
  admin_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
  )
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_admin_earning_goals_updated_at
BEFORE UPDATE ON public.admin_earning_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_timestamp();