-- Add new columns to support enhanced blog generation
ALTER TABLE blog_generation_requests 
ADD COLUMN quality_checks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN discovered_keywords jsonb DEFAULT '[]'::jsonb,
ADD COLUMN image_plans jsonb DEFAULT '[]'::jsonb,
ADD COLUMN sources jsonb DEFAULT '[]'::jsonb,
ADD COLUMN readability_score text,
ADD COLUMN all_checks_passed boolean DEFAULT false;

-- Add new status for posts that need review
ALTER TABLE blog_posts 
ADD COLUMN readability_score text,
ADD COLUMN quality_score integer,
ADD COLUMN last_quality_check timestamp with time zone;

-- Create table for content blocks (for structured blog layouts)
CREATE TABLE blog_content_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  block_type text NOT NULL, -- 'hero', 'toc', 'section', 'tips', 'cta', 'author'
  position integer NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on blog_content_blocks
ALTER TABLE blog_content_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies for blog_content_blocks
CREATE POLICY "Admins can manage blog content blocks" 
ON blog_content_blocks 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "Anyone can view content blocks for published posts" 
ON blog_content_blocks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM blog_posts 
  WHERE blog_posts.id = blog_content_blocks.post_id 
  AND blog_posts.status = 'published'
));

-- Create table for source citations
CREATE TABLE blog_post_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  source_title text NOT NULL,
  source_url text,
  source_type text, -- 'website', 'book', 'journal', 'report'
  citation_text text,
  position integer,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on blog_post_sources
ALTER TABLE blog_post_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for blog_post_sources
CREATE POLICY "Admins can manage blog post sources" 
ON blog_post_sources 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role IN ('admin', 'owner')
));

CREATE POLICY "Anyone can view sources for published posts" 
ON blog_post_sources 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM blog_posts 
  WHERE blog_posts.id = blog_post_sources.post_id 
  AND blog_posts.status = 'published'
));

-- Update blog_posts trigger to handle updated_at
CREATE TRIGGER update_blog_content_blocks_updated_at
BEFORE UPDATE ON blog_content_blocks
FOR EACH ROW
EXECUTE FUNCTION update_blog_updated_at();

-- Add indexes for better performance
CREATE INDEX idx_blog_content_blocks_post_id ON blog_content_blocks(post_id);
CREATE INDEX idx_blog_content_blocks_position ON blog_content_blocks(post_id, position);
CREATE INDEX idx_blog_post_sources_post_id ON blog_post_sources(post_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_quality_score ON blog_posts(quality_score);