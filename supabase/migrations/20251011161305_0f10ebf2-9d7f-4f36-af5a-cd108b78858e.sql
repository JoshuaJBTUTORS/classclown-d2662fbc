-- Create video_requests table to track tutor requests with approval workflow
CREATE TABLE IF NOT EXISTS public.video_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_entry_id UUID NOT NULL REFERENCES public.content_calendar(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE CASCADE,
  request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  release_form_accepted BOOLEAN NOT NULL DEFAULT false,
  release_form_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create weekly_release_schedules table for Tuesday 10am releases
CREATE TABLE IF NOT EXISTS public.weekly_release_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE NOT NULL,
  videos_released INTEGER NOT NULL DEFAULT 0,
  total_videos INTEGER NOT NULL DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'released', 'incomplete')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(week_number, year)
);

-- Create tutor_active_assignments table to enforce one video at a time rule
CREATE TABLE IF NOT EXISTS public.tutor_active_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID NOT NULL UNIQUE REFERENCES public.tutors(id) ON DELETE CASCADE,
  calendar_entry_id UUID NOT NULL REFERENCES public.content_calendar(id) ON DELETE CASCADE,
  video_request_id UUID NOT NULL REFERENCES public.video_requests(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  can_request_next BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add new columns to content_calendar
ALTER TABLE public.content_calendar 
ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resubmission_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_available_for_claim BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS current_request_id UUID REFERENCES public.video_requests(id),
ADD COLUMN IF NOT EXISTS release_schedule_id UUID REFERENCES public.weekly_release_schedules(id);

-- Add new columns to content_videos
ALTER TABLE public.content_videos
ADD COLUMN IF NOT EXISTS is_resubmission BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_submission_id UUID REFERENCES public.content_videos(id),
ADD COLUMN IF NOT EXISTS submission_attempt INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0;

-- Add performance tracking columns to content_tutors
ALTER TABLE public.content_tutors
ADD COLUMN IF NOT EXISTS on_time_submissions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_submissions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS missed_deadlines INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_approval_rate NUMERIC(5,2) DEFAULT 0.00;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_requests_tutor ON public.video_requests(tutor_id);
CREATE INDEX IF NOT EXISTS idx_video_requests_calendar ON public.video_requests(calendar_entry_id);
CREATE INDEX IF NOT EXISTS idx_video_requests_status ON public.video_requests(status);
CREATE INDEX IF NOT EXISTS idx_tutor_active_assignments_tutor ON public.tutor_active_assignments(tutor_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_available ON public.content_calendar(is_available_for_claim);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_release ON public.weekly_release_schedules(release_date, status);

-- Enable RLS on new tables
ALTER TABLE public.video_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_release_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_active_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for video_requests
CREATE POLICY "Tutors can view their own requests"
  ON public.video_requests FOR SELECT
  USING (tutor_id = get_current_user_tutor_id());

CREATE POLICY "Tutors can insert requests if no active assignment"
  ON public.video_requests FOR INSERT
  WITH CHECK (
    tutor_id = get_current_user_tutor_id() 
    AND NOT EXISTS (
      SELECT 1 FROM public.tutor_active_assignments 
      WHERE tutor_id = get_current_user_tutor_id()
    )
  );

CREATE POLICY "Owners can manage all requests"
  ON public.video_requests FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- RLS Policies for tutor_active_assignments
CREATE POLICY "Tutors can view their own assignment"
  ON public.tutor_active_assignments FOR SELECT
  USING (tutor_id = get_current_user_tutor_id());

CREATE POLICY "System can manage assignments"
  ON public.tutor_active_assignments FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for weekly_release_schedules
CREATE POLICY "Owners can manage release schedules"
  ON public.weekly_release_schedules FOR ALL
  USING (has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Content tutors can view release schedules"
  ON public.weekly_release_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content_tutors 
      WHERE tutor_id = get_current_user_tutor_id() 
      AND is_active = true
    )
  );

-- Update content_calendar policies for new workflow
DROP POLICY IF EXISTS "Content tutors can claim open videos" ON public.content_calendar;

CREATE POLICY "Content tutors can view available videos"
  ON public.content_calendar FOR SELECT
  USING (
    is_available_for_claim = true 
    AND status = 'planned'::content_status
    AND EXISTS (
      SELECT 1 FROM public.content_tutors 
      WHERE tutor_id = get_current_user_tutor_id() 
      AND is_active = true
    )
  );

-- Update content_videos policies
CREATE POLICY "Tutors can insert videos for their assignments"
  ON public.content_videos FOR INSERT
  WITH CHECK (
    tutor_id = get_current_user_tutor_id()
    AND EXISTS (
      SELECT 1 FROM public.tutor_active_assignments
      WHERE tutor_id = get_current_user_tutor_id()
      AND calendar_entry_id = content_videos.calendar_entry_id
    )
  );

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_video_requests_updated_at
  BEFORE UPDATE ON public.video_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_active_assignments_updated_at
  BEFORE UPDATE ON public.tutor_active_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();