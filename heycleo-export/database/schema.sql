-- HeyCleo Database Schema
-- Run this in Supabase SQL Editor to set up all required tables

-- =============================================
-- CORE USER TABLES
-- =============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  year_group TEXT,
  exam_board TEXT,
  has_cleo_hub_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles
CREATE TYPE public.app_role AS ENUM ('student', 'parent', 'tutor', 'admin', 'owner');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- CLEO CONVERSATION TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.cleo_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT,
  year_group TEXT,
  learning_goal TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  session_stage TEXT DEFAULT 'mic_check',
  voice_duration_seconds INTEGER DEFAULT 0,
  text_message_count INTEGER DEFAULT 0,
  mode_switches INTEGER DEFAULT 0,
  current_model TEXT DEFAULT 'mini',
  lesson_id UUID,
  module_id UUID,
  subject_id UUID,
  total_pauses INTEGER DEFAULT 0,
  resume_count INTEGER DEFAULT 0,
  last_paused_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cleo_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.cleo_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  mode VARCHAR DEFAULT 'voice',
  model_used TEXT DEFAULT 'mini',
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- LESSON PLAN TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.cleo_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  year_group TEXT NOT NULL,
  exam_board TEXT,
  difficulty_tier TEXT CHECK (difficulty_tier IN ('foundation', 'intermediate', 'higher')),
  subject_name TEXT,
  learning_objectives JSONB DEFAULT '[]',
  teaching_sequence JSONB DEFAULT '[]',
  content_block_count INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER,
  difficulty_score INTEGER,
  status TEXT NOT NULL DEFAULT 'generating',
  conversation_id UUID,
  lesson_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cleo_lesson_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.cleo_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_plan_id UUID REFERENCES public.cleo_lesson_plans(id) ON DELETE SET NULL,
  active_step INTEGER NOT NULL DEFAULT 0,
  visible_content_ids JSONB NOT NULL DEFAULT '[]',
  completed_steps JSONB NOT NULL DEFAULT '[]',
  completion_percentage INTEGER NOT NULL DEFAULT 0,
  last_step_title TEXT,
  last_content_block_id TEXT,
  last_cleo_message TEXT,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cleo_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.cleo_conversations(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  understanding_level INTEGER NOT NULL,
  questions_asked INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cleo_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.cleo_conversations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer_id TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds INTEGER,
  step_id TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- GAMIFICATION TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_gamification_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_coins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  lessons_completed INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT,
  earned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- VOICE QUOTA TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.voice_session_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_minutes_allowed INTEGER NOT NULL DEFAULT 15,
  minutes_used NUMERIC(10,2) DEFAULT 0,
  minutes_remaining NUMERIC(10,2) DEFAULT 15,
  bonus_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- =============================================
-- SUBSCRIPTION TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.platform_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  minutes_per_month INTEGER NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.platform_subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  has_used_trial BOOLEAN DEFAULT false,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- COURSE CONTENT TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  difficulty_level TEXT,
  curriculum TEXT,
  status TEXT DEFAULT 'draft',
  is_free_for_all BOOLEAN DEFAULT false,
  cover_image_url TEXT,
  price INTEGER,
  stripe_price_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,
  content_url TEXT,
  content_text TEXT,
  duration_minutes INTEGER,
  position INTEGER NOT NULL,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_board_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_board TEXT NOT NULL,
  subject_id UUID,
  specification_code TEXT,
  specification_name TEXT,
  content_text TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_lesson_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cleo_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_session_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.cleo_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.cleo_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.cleo_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.cleo_conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.cleo_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can create messages" ON public.cleo_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- Lesson plans policies
CREATE POLICY "Authenticated users can view lesson plans" ON public.cleo_lesson_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create lesson plans" ON public.cleo_lesson_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update lesson plans" ON public.cleo_lesson_plans FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Lesson state policies
CREATE POLICY "Users can view own lesson state" ON public.cleo_lesson_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson state" ON public.cleo_lesson_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson state" ON public.cleo_lesson_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lesson state" ON public.cleo_lesson_state FOR DELETE USING (auth.uid() = user_id);

-- Gamification policies
CREATE POLICY "Users can view own stats" ON public.user_gamification_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_gamification_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.user_gamification_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Voice quota policies
CREATE POLICY "Users can view own quotas" ON public.voice_session_quotas FOR SELECT USING (auth.uid() = user_id);

-- Course policies (public read)
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can view course modules" ON public.course_modules FOR SELECT 
  USING (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND status = 'published'));
CREATE POLICY "Anyone can view course lessons" ON public.course_lessons FOR SELECT 
  USING (EXISTS (SELECT 1 FROM course_modules cm JOIN courses c ON c.id = cm.course_id WHERE cm.id = module_id AND c.status = 'published'));

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.cleo_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_state_updated_at BEFORE UPDATE ON public.cleo_lesson_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gamification_updated_at BEFORE UPDATE ON public.user_gamification_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize gamification stats on profile creation
CREATE OR REPLACE FUNCTION public.initialize_user_gamification_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_gamification_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER init_gamification_on_profile AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION initialize_user_gamification_stats();

-- Initialize free voice quota on profile creation
CREATE OR REPLACE FUNCTION public.initialize_free_session_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.voice_session_quotas (
    user_id, period_start, period_end,
    total_minutes_allowed, minutes_used, minutes_remaining, bonus_minutes
  ) VALUES (
    NEW.id, NOW(), NOW() + INTERVAL '30 days',
    15, 0, 15, 0
  )
  ON CONFLICT (user_id, period_start) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER init_quota_on_profile AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION initialize_free_session_quota();

-- =============================================
-- ENABLE REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE cleo_messages;

-- =============================================
-- INSERT DEFAULT SUBSCRIPTION PLANS
-- =============================================

INSERT INTO public.platform_subscription_plans (name, description, minutes_per_month, price_monthly, is_active) VALUES
('Starter', '50 minutes of Cleo time per month', 50, 999, true),
('Standard', '100 minutes of Cleo time per month', 100, 1999, true),
('Booster', '250 minutes of Cleo time per month', 250, 4500, true),
('Pro', '500 minutes of Cleo time per month', 500, 9800, true)
ON CONFLICT DO NOTHING;
