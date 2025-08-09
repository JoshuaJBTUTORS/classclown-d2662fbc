import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Search, BookOpen, Calendar, User, Tag } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string;
  category: { name: string; slug: string };
  tags: { name: string; slug: string }[];
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

const Blog = () => {
  const { category } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');

  // Fetch published blog posts
  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ['public-blog-posts', selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          published_at,
          category:blog_categories(name, slug),
          tags:blog_post_tags(tag:blog_tags(name, slug))
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Filter by category if selected
      if (selectedCategory !== 'all') {
        const { data: categoryData } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', selectedCategory)
          .single();
        
        if (categoryData) {
          query = query.eq('category_id', categoryData.id);
        }
      }

      // Search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to flatten tags
      return data?.map(post => ({
        ...post,
        tags: post.tags?.map(t => t.tag).filter(Boolean) || [],
      })) as BlogPost[];
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['public-blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as BlogCategory[];
    },
  });

  // Fetch featured posts (latest 3)
  const { data: featuredPosts } = useQuery({
    queryKey: ['featured-blog-posts'],
    queryFn: async () => {
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
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            JB Tutors Study Hub
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Expert GCSE guidance, study tips, and educational insights to help you excel
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background text-foreground"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Category Filter */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  size="sm"
                >
                  All Subjects
                </Button>
                {categories?.slice(0, 6).map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(category.slug)}
                    size="sm"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Blog Posts Grid */}
            {isLoading ? (
              <div className="grid gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6">
                {blogPosts?.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {post.category?.name}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.published_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <Link 
                            to={`/blog/${post.slug}`}
                            className="group"
                          >
                            <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                              {post.title}
                            </h2>
                          </Link>
                          
                          <p className="text-muted-foreground mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>

                          {post.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {post.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag.slug} variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center text-primary hover:underline"
                      >
                        Read More
                        <BookOpen className="h-4 w-4 ml-1" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}

                {blogPosts?.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search or category filter.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Posts */}
            {featuredPosts && featuredPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Latest Articles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featuredPosts.map((post) => (
                    <div key={post.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="group"
                      >
                        <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {post.category?.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? 'default' : 'ghost'}
                    onClick={() => setSelectedCategory(category.slug)}
                    className="w-full justify-start"
                    size="sm"
                  >
                    {category.name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Need Personalized Help?</h3>
                <p className="text-sm opacity-90 mb-4">
                  Book a session with our expert GCSE tutors for personalized guidance.
                </p>
                <Link to="/trial-booking">
                  <Button variant="secondary" size="sm" className="w-full">
                    Book Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;