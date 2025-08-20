-- Create tutor_earning_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tutor_earning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL,
  goal_amount INTEGER NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  goal_start_date DATE NOT NULL,
  goal_end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT tutor_earning_goals_tutor_period_date_unique 
    UNIQUE (tutor_id, period, goal_start_date)
);

-- Enable RLS
ALTER TABLE public.tutor_earning_goals ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Tutors can view their own earning goals" ON public.tutor_earning_goals;
DROP POLICY IF EXISTS "Tutors can create their own earning goals" ON public.tutor_earning_goals;
DROP POLICY IF EXISTS "Tutors can update their own earning goals" ON public.tutor_earning_goals;
DROP POLICY IF EXISTS "Tutors can delete their own earning goals" ON public.tutor_earning_goals;
DROP POLICY IF EXISTS "Admins can manage all tutor earning goals" ON public.tutor_earning_goals;

-- Create comprehensive RLS policies
CREATE POLICY "Tutors can view their own earning goals" 
ON public.tutor_earning_goals 
FOR SELECT 
USING (tutor_id = get_current_user_tutor_id());

CREATE POLICY "Tutors can create their own earning goals" 
ON public.tutor_earning_goals 
FOR INSERT 
WITH CHECK (tutor_id = get_current_user_tutor_id());

CREATE POLICY "Tutors can update their own earning goals" 
ON public.tutor_earning_goals 
FOR UPDATE 
USING (tutor_id = get_current_user_tutor_id())
WITH CHECK (tutor_id = get_current_user_tutor_id());

CREATE POLICY "Tutors can delete their own earning goals" 
ON public.tutor_earning_goals 
FOR DELETE 
USING (tutor_id = get_current_user_tutor_id());

CREATE POLICY "Admins can manage all tutor earning goals" 
ON public.tutor_earning_goals 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_tutor_earning_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tutor_earning_goals_updated_at_trigger ON public.tutor_earning_goals;
CREATE TRIGGER update_tutor_earning_goals_updated_at_trigger
  BEFORE UPDATE ON public.tutor_earning_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_tutor_earning_goals_updated_at();