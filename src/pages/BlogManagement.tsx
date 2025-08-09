import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Edit, Eye, Plus, Trash2, Wand2 } from 'lucide-react';
import PageTitle from '@/components/ui/PageTitle';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published' | 'archived' | 'needs_review';
  category: { name: string; slug: string };
  published_at: string;
  created_at: string;
  readability_score?: string;
  quality_score?: number;
  last_quality_check?: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface BlogGenerationRequest {
  id: string;
  topic: string;
  target_keywords: string[];
  category: { name: string };
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  error_message?: string;
  quality_checks?: any[];
  discovered_keywords?: any[];
  image_plans?: any[];
  sources?: any[];
  readability_score?: string;
  all_checks_passed?: boolean;
}

const BlogManagement = () => {
  const navigate = useNavigate();
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    topic: '',
    keywords: '',
    categoryId: '',
  });
  const queryClient = useQueryClient();

  // Fetch blog posts
  const { data: blogPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          status,
          published_at,
          created_at,
          readability_score,
          quality_score,
          last_quality_check,
          category:blog_categories(name, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Handle case where new columns don't exist yet
        if (error.message.includes('does not exist')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('blog_posts')
            .select(`
              id,
              title,
              slug,
              excerpt,
              status,
              published_at,
              created_at,
              category:blog_categories(name, slug)
            `)
            .order('created_at', { ascending: false });
          
          if (fallbackError) throw fallbackError;
          return fallbackData as BlogPost[];
        }
        throw error;
      }
      return data as BlogPost[];
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as BlogCategory[];
    },
  });

  // Fetch generation requests
  const { data: generationRequests } = useQuery({
    queryKey: ['blog-generation-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_generation_requests')
        .select(`
          id,
          topic,
          target_keywords,
          status,
          created_at,
          error_message,
          quality_checks,
          discovered_keywords,
          image_plans,
          sources,
          readability_score,
          all_checks_passed,
          category:blog_categories(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        // Handle case where new columns don't exist yet
        if (error.message.includes('does not exist')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('blog_generation_requests')
            .select(`
              id,
              topic,
              target_keywords,
              status,
              created_at,
              error_message,
              category:blog_categories(name)
            `)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (fallbackError) throw fallbackError;
          return fallbackData as BlogGenerationRequest[];
        }
        throw error;
      }
      return data as BlogGenerationRequest[];
    },
  });

  // Generate blog content mutation
  const generateContentMutation = useMutation({
    mutationFn: async (formData: typeof generateForm) => {
      // Create generation request first
      const { data: request, error: requestError } = await supabase
        .from('blog_generation_requests')
        .insert({
          topic: formData.topic,
          target_keywords: formData.keywords.split(',').map(k => k.trim()),
          category_id: formData.categoryId,
          status: 'pending',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Call the edge function to generate content
      const { error: functionError } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          topic: formData.topic,
          keywords: formData.keywords.split(',').map(k => k.trim()),
          categoryId: formData.categoryId,
          requestId: request.id,
        },
      });

      if (functionError) throw functionError;

      return request;
    },
    onSuccess: () => {
      toast.success('Blog content generation started! Check the AI Requests tab for progress.');
      setIsGenerateDialogOpen(false);
      setGenerateForm({ topic: '', keywords: '', categoryId: '' });
      queryClient.invalidateQueries({ queryKey: ['blog-generation-requests'] });
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error) => {
      toast.error(`Failed to generate content: ${error.message}`);
    },
  });

  // Publish post mutation
  const publishPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Blog post published successfully!');
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error) => {
      toast.error(`Failed to publish post: ${error.message}`);
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Blog post deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-yellow-500';
      case 'needs_review': return 'bg-orange-500';
      case 'archived': return 'bg-gray-500';
      case 'completed': return 'bg-green-500';
      case 'generating': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getQualityScoreColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <PageTitle>Blog Management</PageTitle>
        
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Wand2 className="h-4 w-4" />
              Generate with AI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Generate Blog Content with AI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">Blog Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., GCSE Mathematics Revision Tips"
                  value={generateForm.topic}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, topic: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="keywords">Target Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., GCSE maths revision, exam tips, algebra help"
                  value={generateForm.keywords}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, keywords: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={generateForm.categoryId} onValueChange={(value) => setGenerateForm(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={() => generateContentMutation.mutate(generateForm)}
                disabled={!generateForm.topic || !generateForm.keywords || !generateForm.categoryId || generateContentMutation.isPending}
                className="w-full"
              >
                {generateContentMutation.isPending ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Blog Post
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Blog Posts</TabsTrigger>
          <TabsTrigger value="requests">AI Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {postsLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-1"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {blogPosts?.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{post.title}</h3>
                          <Badge variant="secondary" className={getStatusColor(post.status)}>
                            {post.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Category: {post.category?.name} • Slug: /{post.slug}
                        </p>
                        {(post.quality_score || post.readability_score) && (
                          <div className="flex items-center gap-4 mb-2">
                            {post.quality_score && (
                              <span className={`text-sm font-medium ${getQualityScoreColor(post.quality_score)}`}>
                                Quality Score: {post.quality_score}/100
                              </span>
                            )}
                            {post.readability_score && (
                              <span className="text-sm text-muted-foreground">
                                Readability: {post.readability_score}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/blog-management/edit/${post.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {post.status === 'draft' && (
                          <Button 
                            size="sm" 
                            onClick={() => publishPostMutation.mutate(post.id)}
                            disabled={publishPostMutation.isPending}
                          >
                            Publish
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          disabled={deletePostMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {blogPosts?.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate your first AI-powered blog post to get started.
                    </p>
                    <Button onClick={() => setIsGenerateDialogOpen(true)}>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate First Post
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid gap-4">
            {generationRequests?.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{request.topic}</h3>
                        <Badge variant="secondary" className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Category: {request.category?.name}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Keywords: {request.target_keywords?.join(', ')}
                      </p>
                      
                      {/* Enhanced Quality Information */}
                      {request.discovered_keywords && request.discovered_keywords.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Discovered Keywords:</p>
                          <p className="text-xs text-muted-foreground">
                            {request.discovered_keywords.map((kw: any) => kw.keyword || kw).join(', ')}
                          </p>
                        </div>
                      )}
                      
                      {request.readability_score && (
                        <p className="text-xs text-muted-foreground mb-1">
                          Readability: {request.readability_score}
                        </p>
                      )}
                      
                      {request.quality_checks && request.quality_checks.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Quality Checks:</p>
                          <div className="flex flex-wrap gap-1">
                            {request.quality_checks.map((check: any, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant={check.status === 'PASS' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {check.rule}: {check.status}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {request.sources && request.sources.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Sources: {request.sources.length} citations
                          </p>
                        </div>
                      )}
                      
                      {request.image_plans && request.image_plans.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Images: {request.image_plans.length} planned
                          </p>
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(request.created_at).toLocaleString()}
                      </p>
                      
                      {request.error_message && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {request.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {generationRequests?.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No AI generation requests yet</h3>
                  <p className="text-muted-foreground">
                    Your AI content generation requests will appear here.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlogManagement;