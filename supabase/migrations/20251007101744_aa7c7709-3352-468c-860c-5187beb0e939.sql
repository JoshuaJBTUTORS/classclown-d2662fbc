-- Create enum for content status
CREATE TYPE public.content_status AS ENUM (
  'planned',
  'assigned',
  'uploaded',
  'approved',
  'rejected',
  'downloaded',
  'archived'
);

-- Create enum for video format
CREATE TYPE public.video_format AS ENUM (
  'tiktok_reel',
  'youtube_short',
  'instagram_reel'
);

-- Content Calendar Table (360 pre-populated entries)
CREATE TABLE public.content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  week_number INTEGER CHECK (week_number >= 1 AND week_number <= 52),
  subject TEXT NOT NULL CHECK (subject IN ('Maths', 'English', 'Science')),
  video_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  hook TEXT,
  summary TEXT,
  talking_points TEXT[],
  lighting_requirements TEXT,
  audio_requirements TEXT,
  quality_requirements TEXT,
  video_format public.video_format DEFAULT 'tiktok_reel',
  max_duration_seconds INTEGER DEFAULT 60,
  status public.content_status DEFAULT 'planned',
  assigned_tutor_id UUID REFERENCES public.tutors(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Videos Table (Tutor uploads)
CREATE TABLE public.content_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_entry_id UUID REFERENCES public.content_calendar(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size_mb NUMERIC(10, 2),
  duration_seconds INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status public.content_status DEFAULT 'uploaded',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  downloaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Tutors Table (Designated content creators)
CREATE TABLE public.content_tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_videos_contributed INTEGER DEFAULT 0,
  total_approved INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  average_approval_time_hours NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Founder Videos Table (Self-approval workflow)
CREATE TABLE public.founder_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  year INTEGER NOT NULL,
  topic TEXT NOT NULL,
  script TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  file_size_mb NUMERIC(10, 2),
  duration_seconds INTEGER,
  status public.content_status DEFAULT 'planned',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Replacement Suggestions Table
CREATE TABLE public.video_replacement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_entry_id UUID REFERENCES public.content_calendar(id) ON DELETE CASCADE NOT NULL,
  tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE NOT NULL,
  original_topic TEXT NOT NULL,
  suggested_topic TEXT NOT NULL,
  justification TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for content videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-videos',
  'content-videos',
  false,
  524288000, -- 500MB max
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for content_calendar
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage content calendar"
ON public.content_calendar
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'))
WITH CHECK (has_role(auth.uid(), 'owner'));

CREATE POLICY "Content tutors can view their assignments"
ON public.content_calendar
FOR SELECT
TO authenticated
USING (
  assigned_tutor_id IN (
    SELECT id FROM public.tutors WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- RLS Policies for content_videos
ALTER TABLE public.content_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage all content videos"
ON public.content_videos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'))
WITH CHECK (has_role(auth.uid(), 'owner'));

CREATE POLICY "Tutors can upload their own videos"
ON public.content_videos
FOR INSERT
TO authenticated
WITH CHECK (
  tutor_id IN (
    SELECT id FROM public.tutors WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Tutors can view their own videos"
ON public.content_videos
FOR SELECT
TO authenticated
USING (
  tutor_id IN (
    SELECT id FROM public.tutors WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- RLS Policies for content_tutors
ALTER TABLE public.content_tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage content tutors"
ON public.content_tutors
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'))
WITH CHECK (has_role(auth.uid(), 'owner'));

CREATE POLICY "Content tutors can view their own profile"
ON public.content_tutors
FOR SELECT
TO authenticated
USING (
  tutor_id IN (
    SELECT id FROM public.tutors WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- RLS Policies for founder_videos
ALTER TABLE public.founder_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage founder videos"
ON public.founder_videos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'))
WITH CHECK (has_role(auth.uid(), 'owner'));

-- RLS Policies for video_replacement_suggestions
ALTER TABLE public.video_replacement_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage replacement suggestions"
ON public.video_replacement_suggestions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'))
WITH CHECK (has_role(auth.uid(), 'owner'));

CREATE POLICY "Tutors can create suggestions"
ON public.video_replacement_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
  tutor_id IN (
    SELECT id FROM public.tutors WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Tutors can view their own suggestions"
ON public.video_replacement_suggestions
FOR SELECT
TO authenticated
USING (
  tutor_id IN (
    SELECT id FROM public.tutors WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Storage RLS for content-videos bucket
CREATE POLICY "Owners can manage all content videos in storage"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'content-videos' AND has_role(auth.uid(), 'owner'))
WITH CHECK (bucket_id = 'content-videos' AND has_role(auth.uid(), 'owner'));

CREATE POLICY "Content tutors can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-videos' AND
  EXISTS (
    SELECT 1 FROM public.content_tutors ct
    JOIN public.tutors t ON ct.tutor_id = t.id
    WHERE t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND ct.is_active = true
  )
);

CREATE POLICY "Content tutors can view their uploaded videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'content-videos' AND
  EXISTS (
    SELECT 1 FROM public.content_tutors ct
    JOIN public.tutors t ON ct.tutor_id = t.id
    WHERE t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND ct.is_active = true
  )
);

-- Create indexes for performance
CREATE INDEX idx_content_calendar_status ON public.content_calendar(status);
CREATE INDEX idx_content_calendar_assigned_tutor ON public.content_calendar(assigned_tutor_id);
CREATE INDEX idx_content_calendar_due_date ON public.content_calendar(due_date);
CREATE INDEX idx_content_calendar_month_subject ON public.content_calendar(month, subject);
CREATE INDEX idx_content_videos_status ON public.content_videos(status);
CREATE INDEX idx_content_videos_calendar_entry ON public.content_videos(calendar_entry_id);
CREATE INDEX idx_founder_videos_week_year ON public.founder_videos(week_number, year);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON public.content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER update_content_videos_updated_at
  BEFORE UPDATE ON public.content_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER update_content_tutors_updated_at
  BEFORE UPDATE ON public.content_tutors
  FOR EACH ROW
  EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER update_founder_videos_updated_at
  BEFORE UPDATE ON public.founder_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER update_video_replacement_suggestions_updated_at
  BEFORE UPDATE ON public.video_replacement_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_content_updated_at();