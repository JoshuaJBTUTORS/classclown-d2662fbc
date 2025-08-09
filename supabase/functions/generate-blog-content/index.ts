import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface KeywordResult {
  keyword: string;
  intent: string;
  difficulty: string;
  volume: string;
  rationale: string;
}

interface ImagePlan {
  section: string;
  description: string;
  altText: string;
  caption: string;
  generatePrompt?: string;
}

interface ContentBlock {
  type: 'hero' | 'toc' | 'section' | 'tips' | 'cta' | 'author';
  content: any;
}

interface QualityCheck {
  rule: string;
  status: 'PASS' | 'FAIL';
  suggestion?: string;
}

// Multi-stage content generation functions
async function discoverKeywords(topic: string, existingSlugs: string[] = []): Promise<KeywordResult[]> {
  const prompt = `Given the seed topic "${topic}", list 5 long-tail keywords with intent, monthly volume (approx), and difficulty. Recommend 1 primary + 2 secondary for fastest ranking opportunity. Avoid overlap with: ${existingSlugs.join(', ')}.

Format as JSON array with objects containing: keyword, intent, difficulty, volume, rationale, isPrimary (boolean)`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are an SEO expert specializing in educational content keywords.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  
  // Extract JSON from response
  const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Failed to extract keywords');
}

async function planImages(outline: string): Promise<ImagePlan[]> {
  const prompt = `From this outline "${outline}", propose 3 images with alt text and captions. Prefer educational diagrams. If no suitable stock idea exists, provide a text-to-image prompt.

Format as JSON array with: section, description, altText, caption, generatePrompt (optional)`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are a content designer specializing in educational blog images.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  
  const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return [];
}

async function generateValueFirstContent(keywords: KeywordResult[], topic: string): Promise<any> {
  const primaryKeyword = keywords.find(k => k.isPrimary)?.keyword || keywords[0]?.keyword;
  
  const prompt = `Write a blog post about "${topic}" for GCSE students and parents. Be practical and tutorial-led. Use "${primaryKeyword}" naturally in H1 and at least one H2. Include numbered steps, a mini case example, and cite 3 credible sources. Avoid sales language.

Requirements:
- 1,200-1,800 words
- H2/H3 structure with clear sections
- Step-by-step instructions where applicable
- Real examples and comparisons
- Grade 8-10 readability
- Educational, not promotional tone

Format as JSON with: title, excerpt, content (HTML), outline, sources[], readabilityScore`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are an expert educational content writer specializing in GCSE tutoring.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  const data = await response.json();
  const rawContent = data.choices[0].message.content;
  
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Failed to generate content');
}

async function insertStrategicCTAs(content: string): Promise<string> {
  const prompt = `Insert exactly two CTAs labeled "Book a free trial": one after the first solution section, one in a final callout. Keep each CTA ≤ 25 words. No urgency language. Use helpful, zero-pressure tone.

CTA should be: "Ready to get personalized help with your studies? Book a free trial lesson with our expert tutors."

Return the updated HTML content with CTAs inserted.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        { role: 'system', content: 'You are a conversion optimization expert focused on educational services.' },
        { role: 'user', content: prompt + '\n\nContent:\n' + content }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function performQualityChecks(post: any, keywords: KeywordResult[]): Promise<QualityCheck[]> {
  const checks: QualityCheck[] = [];
  
  // SEO checks
  checks.push({
    rule: 'Title length ≤ 60 characters',
    status: post.title.length <= 60 ? 'PASS' : 'FAIL',
    suggestion: post.title.length > 60 ? 'Shorten title to under 60 characters' : undefined
  });
  
  checks.push({
    rule: 'Meta description ≤ 155 characters',
    status: post.excerpt.length <= 155 ? 'PASS' : 'FAIL',
    suggestion: post.excerpt.length > 155 ? 'Shorten meta description' : undefined
  });
  
  // Keyword density check
  const primaryKeyword = keywords.find(k => k.isPrimary)?.keyword || keywords[0]?.keyword;
  const hasKeywordInTitle = post.title.toLowerCase().includes(primaryKeyword.toLowerCase());
  checks.push({
    rule: 'Primary keyword in title',
    status: hasKeywordInTitle ? 'PASS' : 'FAIL',
    suggestion: !hasKeywordInTitle ? `Include "${primaryKeyword}" in title` : undefined
  });
  
  // CTA check
  const ctaCount = (post.content.match(/Book a free trial/g) || []).length;
  checks.push({
    rule: 'Exactly 2 CTAs present',
    status: ctaCount === 2 ? 'PASS' : 'FAIL',
    suggestion: ctaCount !== 2 ? `Adjust CTA count to exactly 2 (currently ${ctaCount})` : undefined
  });
  
  // Content quality checks
  const wordCount = post.content.split(' ').length;
  checks.push({
    rule: 'Word count 1,200-1,800',
    status: wordCount >= 1200 && wordCount <= 1800 ? 'PASS' : 'FAIL',
    suggestion: wordCount < 1200 ? 'Add more content' : wordCount > 1800 ? 'Reduce content length' : undefined
  });
  
  return checks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords, categoryId, requestId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update request status to generating
    await supabase
      .from('blog_generation_requests')
      .update({ status: 'generating' })
      .eq('id', requestId);

    // Get category details
    const { data: category } = await supabase
      .from('blog_categories')
      .select('name, description')
      .eq('id', categoryId)
      .single();

    // Get existing slugs to avoid cannibalization
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('category_id', categoryId);
    
    const existingSlugs = existingPosts?.map(p => p.slug) || [];

    console.log('Starting multi-stage content generation...');

    // Stage 1: Keyword Discovery
    console.log('Stage 1: Discovering keywords...');
    const discoveredKeywords = await discoverKeywords(topic, existingSlugs);
    
    // Stage 2: Image Planning (using initial topic as outline)
    console.log('Stage 2: Planning images...');
    const imagePlans = await planImages(topic);
    
    // Stage 3: Value-First Content Generation
    console.log('Stage 3: Generating content...');
    const contentResult = await generateValueFirstContent(discoveredKeywords, topic);
    
    // Stage 4: Strategic CTA Insertion
    console.log('Stage 4: Inserting CTAs...');
    const finalContent = await insertStrategicCTAs(contentResult.content);
    
    // Stage 5: Quality Checks
    console.log('Stage 5: Performing quality checks...');
    const finalPost = { ...contentResult, content: finalContent };
    const qualityChecks = await performQualityChecks(finalPost, discoveredKeywords);
    
    // Check if all quality checks pass
    const allChecksPassed = qualityChecks.every(check => check.status === 'PASS');
    
    if (!allChecksPassed) {
      console.log('Quality checks failed:', qualityChecks.filter(c => c.status === 'FAIL'));
      // You could implement auto-fixes here or flag for manual review
    }

    // Generate comprehensive content using multi-stage approach
    const primaryKeyword = discoveredKeywords.find(k => k.isPrimary)?.keyword || discoveredKeywords[0]?.keyword || topic;
    
    const generatedContent = {
      title: finalPost.title,
      excerpt: finalPost.excerpt,
      content: finalPost.content,
      metaTitle: finalPost.title,
      metaDescription: finalPost.excerpt,
      slug: finalPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      focusKeyword: primaryKeyword,
      targetKeywords: discoveredKeywords.map(k => k.keyword),
      qualityChecks: qualityChecks,
      keywords: discoveredKeywords,
      imagePlans: imagePlans,
      sources: finalPost.sources || [],
      readabilityScore: finalPost.readabilityScore || 'Not calculated'
    };

    // Create unique slug
    let baseSlug = generatedContent.slug || generatedContent.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and make it unique
    while (true) {
      const { data: existingPost } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (!existingPost) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create blog post with enhanced data
    const { data: blogPost, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: generatedContent.title,
        slug: slug,
        excerpt: generatedContent.excerpt,
        content: generatedContent.content,
        category_id: categoryId,
        status: allChecksPassed ? 'draft' : 'needs_review',
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (postError) {
      throw new Error(`Failed to create blog post: ${postError.message}`);
    }

    // Create enhanced SEO data
    await supabase
      .from('blog_seo_data')
      .insert({
        post_id: blogPost.id,
        meta_title: generatedContent.metaTitle || generatedContent.title,
        meta_description: generatedContent.metaDescription,
        focus_keyword: generatedContent.focusKeyword,
        target_keywords: generatedContent.targetKeywords,
      });

    // Add discovered keywords as tags
    if (generatedContent.targetKeywords.length > 0) {
      for (const keyword of generatedContent.targetKeywords) {
        // Find or create tag
        let { data: tag } = await supabase
          .from('blog_tags')
          .select('id')
          .eq('name', keyword)
          .single();

        if (!tag) {
          const tagSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const { data: newTag } = await supabase
            .from('blog_tags')
            .insert({ name: keyword, slug: tagSlug })
            .select()
            .single();
          tag = newTag;
        }

        if (tag) {
          await supabase
            .from('blog_post_tags')
            .insert({
              post_id: blogPost.id,
              tag_id: tag.id,
            });
        }
      }
    }

    // Update request status to completed
    await supabase
      .from('blog_generation_requests')
      .update({
        status: allChecksPassed ? 'completed' : 'needs_review',
        generated_post_id: blogPost.id,
      })
      .eq('id', requestId);

    console.log('Content generation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        blogPost: {
          id: blogPost.id,
          title: blogPost.title,
          slug: blogPost.slug,
          excerpt: blogPost.excerpt,
          status: blogPost.status,
        },
        qualityChecks: generatedContent.qualityChecks,
        keywords: generatedContent.keywords,
        imagePlans: generatedContent.imagePlans,
        sources: generatedContent.sources,
        readabilityScore: generatedContent.readabilityScore,
        allChecksPassed,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating blog content:', error);

    // Update request status to failed if requestId exists
    if (error.requestId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('blog_generation_requests')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', error.requestId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});