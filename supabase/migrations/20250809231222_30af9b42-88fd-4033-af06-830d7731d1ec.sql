-- Create blog categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  category_id UUID REFERENCES public.blog_categories(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog post tags junction table
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  UNIQUE(post_id, tag_id)
);

-- Create blog SEO data table
CREATE TABLE IF NOT EXISTS public.blog_seo_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image_url TEXT,
  focus_keyword TEXT,
  target_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog generation requests table
CREATE TABLE IF NOT EXISTS public.blog_generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  target_keywords TEXT[],
  category_id UUID REFERENCES public.blog_categories(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  generated_post_id UUID REFERENCES public.blog_posts(id),
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_seo_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_generation_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blog_categories
CREATE POLICY "Anyone can view published blog categories" ON public.blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog categories" ON public.blog_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Create RLS policies for blog_tags
CREATE POLICY "Anyone can view blog tags" ON public.blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog tags" ON public.blog_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Create RLS policies for blog_posts
CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all blog posts" ON public.blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Create RLS policies for blog_post_tags
CREATE POLICY "Anyone can view blog post tags" ON public.blog_post_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts 
      WHERE id = post_id AND status = 'published'
    )
  );

CREATE POLICY "Admins can manage blog post tags" ON public.blog_post_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Create RLS policies for blog_seo_data
CREATE POLICY "Anyone can view SEO data for published posts" ON public.blog_seo_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_posts 
      WHERE id = post_id AND status = 'published'
    )
  );

CREATE POLICY "Admins can manage blog SEO data" ON public.blog_seo_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Create RLS policies for blog_generation_requests
CREATE POLICY "Users can view their own generation requests" ON public.blog_generation_requests
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can view all generation requests" ON public.blog_generation_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can manage generation requests" ON public.blog_generation_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON public.blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON public.blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_blog_generation_requests_status ON public.blog_generation_requests(status);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

CREATE TRIGGER update_blog_seo_data_updated_at
  BEFORE UPDATE ON public.blog_seo_data
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

CREATE TRIGGER update_blog_generation_requests_updated_at
  BEFORE UPDATE ON public.blog_generation_requests
  FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at();

-- Insert GCSE subject categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Mathematics', 'mathematics', 'GCSE Mathematics tutorials, tips, and exam preparation'),
  ('English Literature', 'english-literature', 'GCSE English Literature analysis, essays, and study guides'),
  ('English Language', 'english-language', 'GCSE English Language skills, writing techniques, and comprehension'),
  ('Science', 'science', 'General GCSE Science topics and interdisciplinary content'),
  ('Biology', 'biology', 'GCSE Biology concepts, experiments, and exam preparation'),
  ('Chemistry', 'chemistry', 'GCSE Chemistry topics, reactions, and practical work'),
  ('Physics', 'physics', 'GCSE Physics principles, calculations, and real-world applications'),
  ('History', 'history', 'GCSE History periods, events, and analytical skills'),
  ('Geography', 'geography', 'GCSE Geography physical and human topics'),
  ('Modern Foreign Languages', 'modern-foreign-languages', 'GCSE language learning tips and cultural insights'),
  ('Computer Science', 'computer-science', 'GCSE Computer Science programming and theory'),
  ('Art and Design', 'art-and-design', 'GCSE Art techniques, portfolios, and creative development'),
  ('Music', 'music', 'GCSE Music theory, composition, and performance'),
  ('Drama', 'drama', 'GCSE Drama techniques, scripts, and performance skills'),
  ('Physical Education', 'physical-education', 'GCSE PE theory, practical skills, and health'),
  ('Religious Studies', 'religious-studies', 'GCSE Religious Studies ethics, beliefs, and philosophy'),
  ('Business Studies', 'business-studies', 'GCSE Business concepts, case studies, and entrepreneurship'),
  ('Economics', 'economics', 'GCSE Economics principles, markets, and current affairs'),
  ('Psychology', 'psychology', 'GCSE Psychology theories, studies, and applications'),
  ('Sociology', 'sociology', 'GCSE Sociology concepts, research methods, and social issues')
ON CONFLICT (slug) DO NOTHING;

-- Insert common long-tail keywords as tags
INSERT INTO public.blog_tags (name, slug) VALUES
  ('GCSE exam tips', 'gcse-exam-tips'),
  ('revision techniques', 'revision-techniques'),
  ('study guides', 'study-guides'),
  ('past papers', 'past-papers'),
  ('grade boundaries', 'grade-boundaries'),
  ('exam preparation', 'exam-preparation'),
  ('coursework help', 'coursework-help'),
  ('online tutoring', 'online-tutoring'),
  ('private tutors', 'private-tutors'),
  ('homework help', 'homework-help'),
  ('learning strategies', 'learning-strategies'),
  ('exam anxiety', 'exam-anxiety'),
  ('time management', 'time-management'),
  ('note taking', 'note-taking'),
  ('memory techniques', 'memory-techniques'),
  ('mock exams', 'mock-exams'),
  ('grade improvement', 'grade-improvement'),
  ('university preparation', 'university-preparation'),
  ('career guidance', 'career-guidance'),
  ('subject choices', 'subject-choices'),
  ('parental support', 'parental-support'),
  ('student motivation', 'student-motivation'),
  ('learning difficulties', 'learning-difficulties'),
  ('special educational needs', 'special-educational-needs'),
  ('exam boards', 'exam-boards')
ON CONFLICT (slug) DO NOTHING;