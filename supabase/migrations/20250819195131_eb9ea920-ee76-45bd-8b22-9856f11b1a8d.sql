-- Create tutor earning goals table
CREATE TABLE public.tutor_earning_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tutor_id UUID NOT NULL,
  goal_amount NUMERIC NOT NULL,
  goal_period TEXT NOT NULL CHECK (goal_period IN ('weekly', 'monthly')),
  goal_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tutor_id, goal_period, goal_start_date)
);

-- Enable Row Level Security
ALTER TABLE public.tutor_earning_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for tutors to manage their own goals
CREATE POLICY "Tutors can view their own earning goals" 
ON public.tutor_earning_goals 
FOR SELECT 
USING (tutor_id = public.get_current_user_tutor_id());

CREATE POLICY "Tutors can create their own earning goals" 
ON public.tutor_earning_goals 
FOR INSERT 
WITH CHECK (tutor_id = public.get_current_user_tutor_id());

CREATE POLICY "Tutors can update their own earning goals" 
ON public.tutor_earning_goals 
FOR UPDATE 
USING (tutor_id = public.get_current_user_tutor_id());

CREATE POLICY "Tutors can delete their own earning goals" 
ON public.tutor_earning_goals 
FOR DELETE 
USING (tutor_id = public.get_current_user_tutor_id());

-- Admins can manage all earning goals
CREATE POLICY "Admins can manage all earning goals" 
ON public.tutor_earning_goals 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tutor_earning_goals_updated_at
BEFORE UPDATE ON public.tutor_earning_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();