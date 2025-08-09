
-- Add cancellation fields to lessons table
ALTER TABLE public.lessons 
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN cancelled_count INTEGER DEFAULT 0;

-- Update lesson status to include cancelled (if not already exists)
DO $$
BEGIN
  -- Check if 'cancelled' value already exists in the status column constraints
  -- If not, we'll handle it through application logic for now since altering enums can be complex
  -- The status field will accept 'cancelled' as a text value
END $$;

-- Add index for better performance on cancelled lessons queries
CREATE INDEX idx_lessons_cancelled_at ON public.lessons(cancelled_at) WHERE cancelled_at IS NOT NULL;
