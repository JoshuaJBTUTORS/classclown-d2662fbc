-- Create gamification tables for Cleo ID system

-- 1. User gamification stats table (streaks, levels, energy, focus)
CREATE TABLE public.user_gamification_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak_days integer DEFAULT 0 CHECK (current_streak_days >= 0),
  longest_streak_days integer DEFAULT 0 CHECK (longest_streak_days >= 0),
  last_activity_date date,
  level integer DEFAULT 1 CHECK (level >= 1),
  total_xp integer DEFAULT 0 CHECK (total_xp >= 0),
  energy_percentage integer DEFAULT 100 CHECK (energy_percentage >= 0 AND energy_percentage <= 100),
  focus_score integer DEFAULT 0 CHECK (focus_score >= 0 AND focus_score <= 100),
  learning_persona text DEFAULT 'The Strategist',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. User badges/achievements table
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_type text NOT NULL,
  badge_name text NOT NULL,
  badge_emoji text NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3. User activity log for streak calculation
CREATE TABLE public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  activity_date date DEFAULT CURRENT_DATE NOT NULL,
  xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_gamification_stats
CREATE POLICY "Users can view own gamification stats"
  ON public.user_gamification_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification stats"
  ON public.user_gamification_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification stats"
  ON public.user_gamification_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_badges
CREATE POLICY "Users can view own badges"
  ON public.user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON public.user_badges
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_activity_log
CREATE POLICY "Users can view own activity log"
  ON public.user_activity_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity log"
  ON public.user_activity_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_gamification_stats
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_gamification_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_user_gamification_stats_user_id ON public.user_gamification_stats(user_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_type ON public.user_badges(badge_type);
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_activity_date ON public.user_activity_log(activity_date);

-- Function to initialize gamification stats for new users
CREATE OR REPLACE FUNCTION public.initialize_user_gamification_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_gamification_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Award welcome badge
  INSERT INTO public.user_badges (user_id, badge_type, badge_name, badge_emoji)
  VALUES (NEW.id, 'welcome', 'Welcome to Cleo!', '🎉')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize stats when profile is created
CREATE TRIGGER initialize_gamification_on_profile_create
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_gamification_stats();