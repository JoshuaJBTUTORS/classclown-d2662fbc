
-- Create table for storing assessment improvement recommendations
CREATE TABLE public.assessment_improvements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  weak_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  improvement_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.assessment_improvements ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own improvement recommendations
CREATE POLICY "Users can view their own assessment improvements" 
  ON public.assessment_improvements 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own improvements
CREATE POLICY "Users can create their own assessment improvements" 
  ON public.assessment_improvements 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own improvements
CREATE POLICY "Users can update their own assessment improvements" 
  ON public.assessment_improvements 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_assessment_improvements_updated_at
  BEFORE UPDATE ON public.assessment_improvements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();
