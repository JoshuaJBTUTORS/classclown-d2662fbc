-- Create table for tracking school progress notification cycles
CREATE TABLE public.school_progress_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking sent notifications
CREATE TABLE public.school_progress_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES public.school_progress_cycles(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'summary')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_status TEXT NOT NULL DEFAULT 'sent' CHECK (email_status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_school_progress_cycles_active ON public.school_progress_cycles(is_active, cycle_start_date);
CREATE INDEX idx_school_progress_notifications_cycle ON public.school_progress_notifications(cycle_id);
CREATE INDEX idx_school_progress_notifications_parent ON public.school_progress_notifications(parent_id);
CREATE INDEX idx_school_progress_notifications_type ON public.school_progress_notifications(notification_type, sent_at);

-- Enable Row Level Security
ALTER TABLE public.school_progress_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_progress_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for school_progress_cycles
CREATE POLICY "Admins can manage school progress cycles" 
ON public.school_progress_cycles 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "Anyone can view active cycles" 
ON public.school_progress_cycles 
FOR SELECT 
USING (is_active = true);

-- Create RLS policies for school_progress_notifications
CREATE POLICY "Admins can manage all notifications" 
ON public.school_progress_notifications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "Parents can view their own notifications" 
ON public.school_progress_notifications 
FOR SELECT 
USING (parent_id IN (
  SELECT id FROM public.parents WHERE user_id = auth.uid()
));

-- Create function to get current reporting cycle
CREATE OR REPLACE FUNCTION public.get_current_school_progress_cycle()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.school_progress_cycles 
  WHERE is_active = true 
  AND current_date >= cycle_start_date 
  AND current_date <= cycle_end_date
  LIMIT 1;
$$;

-- Create function to check if parent has been notified in current cycle
CREATE OR REPLACE FUNCTION public.parent_notified_in_cycle(parent_id_param UUID, cycle_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_progress_notifications 
    WHERE parent_id = parent_id_param 
    AND cycle_id = cycle_id_param 
    AND notification_type = 'reminder'
    AND email_status = 'sent'
  );
$$;

-- Add trigger for updating timestamps
CREATE TRIGGER update_school_progress_cycles_updated_at
  BEFORE UPDATE ON public.school_progress_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial cycle starting September 1st, 2024 (6 weeks = 42 days)
INSERT INTO public.school_progress_cycles (cycle_start_date, cycle_end_date, is_active) VALUES
('2024-09-01', '2024-10-13', false),
('2024-10-13', '2024-11-24', false),
('2024-11-24', '2025-01-05', false),
('2025-01-05', '2025-02-16', false),
('2025-02-16', '2025-03-30', true),
('2025-03-30', '2025-05-11', false),
('2025-05-11', '2025-06-22', false),
('2025-06-22', '2025-08-03', false);