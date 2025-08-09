-- Fix blog_posts status constraint to include 'needs_review'
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'published', 'archived', 'needs_review'));

-- Add missing columns to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS readability_score numeric,
ADD COLUMN IF NOT EXISTS word_count integer,
ADD COLUMN IF NOT EXISTS seo_score numeric;

-- Add missing columns to blog_generation_requests table  
ALTER TABLE public.blog_generation_requests
ADD COLUMN IF NOT EXISTS quality_checks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS content_blocks jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS seo_analysis jsonb DEFAULT '{}'::jsonb;

-- Create blog_content_blocks table for structured content
CREATE TABLE IF NOT EXISTS public.blog_content_blocks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    block_type text NOT NULL,
    content text NOT NULL,
    position integer NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on blog_content_blocks
ALTER TABLE public.blog_content_blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blog_content_blocks
CREATE POLICY "Admins can manage blog content blocks" 
ON public.blog_content_blocks
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
));

CREATE POLICY "Anyone can view content blocks for published posts" 
ON public.blog_content_blocks
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM blog_posts 
    WHERE blog_posts.id = blog_content_blocks.post_id 
    AND blog_posts.status = 'published'
));

-- Create blog_post_sources table for citations and sources
CREATE TABLE IF NOT EXISTS public.blog_post_sources (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    source_type text NOT NULL,
    source_url text,
    source_title text,
    source_description text,
    credibility_score numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on blog_post_sources
ALTER TABLE public.blog_post_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blog_post_sources
CREATE POLICY "Admins can manage blog post sources" 
ON public.blog_post_sources
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner')
));

CREATE POLICY "Anyone can view sources for published posts" 
ON public.blog_post_sources
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM blog_posts 
    WHERE blog_posts.id = blog_post_sources.post_id 
    AND blog_posts.status = 'published'
));

-- Add updated_at trigger for new tables
CREATE TRIGGER update_blog_content_blocks_updated_at
    BEFORE UPDATE ON public.blog_content_blocks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_timestamp();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_content_blocks_post_id ON public.blog_content_blocks(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_content_blocks_position ON public.blog_content_blocks(post_id, position);
CREATE INDEX IF NOT EXISTS idx_blog_post_sources_post_id ON public.blog_post_sources(post_id);