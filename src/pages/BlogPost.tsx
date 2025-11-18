import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Calendar, Tag, BookOpen } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published_at: string;
  category: { name: string; slug: string };
  tags: { name: string; slug: string }[];
  seo_data?: {
    meta_title?: string;
    meta_description?: string;
    og_title?: string;
    og_description?: string;
    og_image_url?: string;
  };
}

const BlogPost = () => {
  const { slug } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          content,
          excerpt,
          published_at,
          category:blog_categories(name, slug),
          tags:blog_post_tags(tag:blog_tags(name, slug)),
          seo_data:blog_seo_data(
            meta_title,
            meta_description,
            og_title,
            og_description,
            og_image_url
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;

      // Transform the data to flatten tags and seo_data
      return {
        ...data,
        tags: data.tags?.map(t => t.tag).filter(Boolean) || [],
        seo_data: data.seo_data?.[0] || null,
      } as BlogPostData;
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: relatedPosts } = useQuery({
    queryKey: ['related-blog-posts', post?.category?.slug, post?.id],
    queryFn: async () => {
      if (!post?.category?.slug || !post?.id) return [];

      const { data: categoryData } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('slug', post.category.slug)
        .single();

      if (!categoryData) return [];

      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          published_at,
          category:blog_categories(name, slug)
        `)
        .eq('category_id', categoryData.id)
        .eq('status', 'published')
        .neq('id', post.id)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!post?.category?.slug && !!post?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4"></div>
              <div className="h-12 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Article Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/blog">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const seoTitle = post.seo_data?.meta_title || post.title;
  const seoDescription = post.seo_data?.meta_description || post.excerpt;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{seoTitle} | Class Beyond</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={post.seo_data?.og_title || seoTitle} />
        <meta property="og:description" content={post.seo_data?.og_description || seoDescription} />
        {post.seo_data?.og_image_url && (
          <meta property="og:image" content={post.seo_data.og_image_url} />
        )}
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.published_at} />
        <link rel="canonical" href={`${window.location.origin}/blog/${post.slug}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-8">
            <Link to="/blog">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Button>
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">
                {post.category?.name}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(post.published_at).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {post.title}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              {post.excerpt}
            </p>

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag.slug} variant="outline" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {/* Article Content */}
          <article className="mb-12">
            <div 
              dangerouslySetInnerHTML={{ __html: post.content }}
              className="blog-content"
            />
          </article>

          {/* Call to Action */}
          <Card className="bg-primary text-primary-foreground mb-12">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Need More Help with Your Studies?</h3>
              <p className="text-lg opacity-90 mb-6">
                Our expert GCSE tutors are here to provide personalized support and help you achieve your academic goals.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/trial-booking">
                  <Button variant="secondary" size="lg">
                    Book Free Trial Lesson
                  </Button>
                </Link>
                <Link to="/blog">
                  <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                    Read More Articles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-2">
                        {relatedPost.category?.name}
                      </Badge>
                      
                      <Link 
                        to={`/blog/${relatedPost.slug}`}
                        className="group"
                      >
                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                      </Link>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(relatedPost.published_at).toLocaleDateString()}
                        </span>
                        <Link 
                          to={`/blog/${relatedPost.slug}`}
                          className="text-primary hover:underline text-sm"
                        >
                          Read More
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPost;