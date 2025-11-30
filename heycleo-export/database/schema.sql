-- HeyCleo Database Schema (Complete)
-- Run this in Supabase SQL Editor to set up all required tables
-- Generated: 2025-11-30

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE public.app_role AS ENUM ('student', 'parent', 'tutor', 'admin', 'owner');

-- =============================================
-- CORE REFERENCE TABLES (No Dependencies)
-- =============================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.year_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_name TEXT,
  age_range TEXT,
  curriculum TEXT,
  position INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- =============================================
-- USER TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  avatar_url TEXT,
  year_group TEXT,
  exam_board TEXT,
  subjects TEXT[],
  curriculum TEXT,
  region TEXT,
  has_cleo_hub_access BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  parent_first_name TEXT,
  parent_last_name TEXT,
  parent_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- CURRICULUM & EXAM BOARD TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.curriculum_year_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_group_id UUID REFERENCES public.year_groups(id),
  curriculum TEXT NOT NULL,
  display_name TEXT NOT NULL,
  age_range TEXT,
  national_curriculum_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_board_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_board TEXT NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  description TEXT,
  document_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT,
  extracted_text TEXT,
  summary TEXT,
  key_topics JSONB,
  specification_year INTEGER,
  version TEXT,
  status TEXT DEFAULT 'pending',
  created_by UUID,
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
  is_ai_generated BOOLEAN DEFAULT false,
  generation_status TEXT,
  cover_image_url TEXT,
  price INTEGER,
  stripe_price_id TEXT,
  year_group_id UUID REFERENCES public.year_groups(id),
  exam_board_specification_id UUID REFERENCES public.exam_board_specifications(id),
  path_position INTEGER,
  prerequisites JSONB,
  unlock_requirements JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_exam_board_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_board_specification_id UUID NOT NULL REFERENCES public.exam_board_specifications(id),
  is_default BOOLEAN DEFAULT false,
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

CREATE TABLE IF NOT EXISTS public.course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id),
  status TEXT NOT NULL DEFAULT 'completed',
  amount_paid INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'gbp',
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  has_used_trial BOOLEAN DEFAULT false,
  trial_end TIMESTAMPTZ,
  trial_used_date TIMESTAMPTZ,
  previous_status TEXT,
  grace_period_start TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  purchase_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id),
  lesson_id UUID REFERENCES public.course_lessons(id),
  title TEXT NOT NULL,
  content TEXT,
  note_type TEXT DEFAULT 'note',
  difficulty TEXT DEFAULT 'medium',
  mastery_level INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
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
  model_switches INTEGER DEFAULT 0,
  current_model TEXT DEFAULT 'mini',
  mini_seconds_used INTEGER DEFAULT 0,
  full_seconds_used INTEGER DEFAULT 0,
  lesson_id UUID REFERENCES public.course_lessons(id),
  module_id UUID REFERENCES public.course_modules(id),
  subject_id UUID REFERENCES public.subjects(id),
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

CREATE TABLE IF NOT EXISTS public.cleo_lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  year_group TEXT NOT NULL,
  exam_board TEXT,
  difficulty_tier TEXT CHECK (difficulty_tier IN ('foundation', 'intermediate', 'higher')),
  difficulty_score INTEGER,
  subject_name TEXT,
  learning_objectives JSONB DEFAULT '[]',
  teaching_sequence JSONB DEFAULT '[]',
  content_block_count INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'generating',
  conversation_id UUID,
  lesson_id UUID REFERENCES public.course_lessons(id),
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
-- VOICE QUOTA & SUBSCRIPTION TABLES
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
-- ASSESSMENT TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.ai_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  exam_board TEXT,
  year INTEGER,
  paper_type TEXT,
  total_marks INTEGER DEFAULT 0,
  time_limit_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  is_ai_generated BOOLEAN DEFAULT false,
  ai_confidence_score NUMERIC,
  ai_extraction_data JSONB DEFAULT '{}',
  questions_pdf_url TEXT,
  questions_text TEXT,
  answers_pdf_url TEXT,
  answers_text TEXT,
  processing_status TEXT DEFAULT 'pending',
  processing_error TEXT,
  lesson_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.ai_assessments(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  marks_available INTEGER NOT NULL DEFAULT 1,
  marking_scheme JSONB NOT NULL DEFAULT '{}',
  keywords JSONB DEFAULT '[]',
  image_url TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.ai_assessments(id),
  user_id UUID REFERENCES auth.users(id),
  student_id INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress',
  attempt_number INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_taken_minutes INTEGER,
  total_marks_available INTEGER DEFAULT 0,
  total_marks_achieved INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id),
  student_answer TEXT,
  is_correct BOOLEAN,
  marks_awarded INTEGER DEFAULT 0,
  ai_feedback TEXT,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id),
  weak_topics JSONB NOT NULL DEFAULT '[]',
  recommended_lessons JSONB NOT NULL DEFAULT '[]',
  improvement_summary TEXT,
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
ALTER TABLE public.course_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_board_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exam_board_specifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.cleo_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.cleo_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.cleo_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.cleo_conversations FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all conversations" ON public.cleo_conversations FOR SELECT 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.cleo_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can create messages" ON public.cleo_messages FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own messages" ON public.cleo_messages FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own messages" ON public.cleo_messages FOR DELETE 
  USING (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all messages" ON public.cleo_messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

-- Lesson plans policies
CREATE POLICY "Authenticated users can view lesson plans" ON public.cleo_lesson_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create lesson plans" ON public.cleo_lesson_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update lesson plans" ON public.cleo_lesson_plans FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Lesson state policies
CREATE POLICY "Users can view own lesson state" ON public.cleo_lesson_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lesson state" ON public.cleo_lesson_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own lesson state" ON public.cleo_lesson_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own lesson state" ON public.cleo_lesson_state FOR DELETE USING (auth.uid() = user_id);

-- Learning progress policies
CREATE POLICY "Users can view own progress" ON public.cleo_learning_progress FOR SELECT 
  USING (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can create own progress" ON public.cleo_learning_progress FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own progress" ON public.cleo_learning_progress FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM cleo_conversations WHERE id = conversation_id AND user_id = auth.uid()));

-- Question answers policies
CREATE POLICY "Users can view own answers" ON public.cleo_question_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON public.cleo_question_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gamification policies
CREATE POLICY "Users can view own stats" ON public.user_gamification_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON public.user_gamification_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON public.user_gamification_stats FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Badges policies
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Voice quota policies
CREATE POLICY "Users can view own quotas" ON public.voice_session_quotas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own quotas" ON public.voice_session_quotas FOR UPDATE USING (auth.uid() = user_id);

-- Subscription policies
CREATE POLICY "Users can view own subscriptions" ON public.platform_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Course policies (public read for published)
CREATE POLICY "Anyone can view published courses" ON public.courses FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'tutor')));

CREATE POLICY "Anyone can view published course modules" ON public.course_modules FOR SELECT 
  USING (EXISTS (SELECT 1 FROM courses WHERE id = course_id AND status = 'published'));
CREATE POLICY "Admins can manage course modules" ON public.course_modules FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'tutor')));

CREATE POLICY "Anyone can view published course lessons" ON public.course_lessons FOR SELECT 
  USING (EXISTS (SELECT 1 FROM course_modules cm JOIN courses c ON c.id = cm.course_id WHERE cm.id = module_id AND c.status = 'published'));
CREATE POLICY "Admins can manage course lessons" ON public.course_lessons FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner', 'tutor')));

-- Course notes policies
CREATE POLICY "Users can view own notes" ON public.course_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notes" ON public.course_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.course_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.course_notes FOR DELETE USING (auth.uid() = user_id);

-- Course purchases policies
CREATE POLICY "Users can view own purchases" ON public.course_purchases FOR SELECT USING (auth.uid() = user_id);

-- Assessment policies
CREATE POLICY "Anyone can view published assessments" ON public.ai_assessments FOR SELECT USING (status = 'published');
CREATE POLICY "Users can manage own assessments" ON public.ai_assessments FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Admins can manage all assessments" ON public.ai_assessments FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "Anyone can view published assessment questions" ON public.assessment_questions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM ai_assessments WHERE id = assessment_id AND status = 'published'));
CREATE POLICY "Assessment creators can manage questions" ON public.assessment_questions FOR ALL 
  USING (EXISTS (SELECT 1 FROM ai_assessments WHERE id = assessment_id AND created_by = auth.uid()));
CREATE POLICY "Admins can manage all questions" ON public.assessment_questions FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "Users can manage own sessions" ON public.assessment_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Admins can view all sessions" ON public.assessment_sessions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "Users can manage own responses" ON public.student_responses FOR ALL 
  USING (EXISTS (SELECT 1 FROM assessment_sessions WHERE id = session_id AND user_id = auth.uid()));

CREATE POLICY "Users can view own improvements" ON public.assessment_improvements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own improvements" ON public.assessment_improvements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own improvements" ON public.assessment_improvements FOR UPDATE USING (auth.uid() = user_id);

-- App settings policies
CREATE POLICY "Anyone can read app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage app settings" ON public.app_settings FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

-- Exam board specifications policies
CREATE POLICY "Anyone can view exam board specs" ON public.exam_board_specifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage exam board specs" ON public.exam_board_specifications FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

CREATE POLICY "Anyone can view course exam board links" ON public.course_exam_board_specifications FOR SELECT USING (true);
CREATE POLICY "Admins can manage course exam board links" ON public.course_exam_board_specifications FOR ALL 
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')));

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, check_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = check_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON public.cleo_lesson_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
-- INSERT DEFAULT DATA
-- =============================================

-- Default subscription plans
INSERT INTO public.platform_subscription_plans (name, description, minutes_per_month, price_monthly, is_active) VALUES
('Starter', '50 minutes of Cleo time per month', 50, 999, true),
('Standard', '100 minutes of Cleo time per month', 100, 1999, true),
('Booster', '250 minutes of Cleo time per month', 250, 4500, true),
('Pro', '500 minutes of Cleo time per month', 500, 9800, true)
ON CONFLICT DO NOTHING;

-- Default app version
INSERT INTO public.app_settings (key, value) VALUES ('app_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;
