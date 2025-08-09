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

    // Create SEO-optimized prompt
    const prompt = `Write a comprehensive, SEO-optimized blog post for JB Tutors about "${topic}" in the ${category?.name || 'GCSE'} subject area.

Target Keywords: ${keywords.join(', ')}

Requirements:
1. Write an engaging, informative article of 1500-2000 words
2. Include the primary keyword "${keywords[0] || topic}" naturally throughout
3. Use H2 and H3 subheadings that incorporate keywords
4. Include practical tips, examples, and actionable advice for GCSE students
5. Add a compelling meta description (150-160 characters)
6. Create an engaging excerpt (150-200 words)
7. Structure with clear introduction, body sections, and conclusion
8. Focus on helping students improve their grades and understanding
9. Include references to JB Tutors' expertise and services naturally

Format the response as a JSON object with these fields:
- title: SEO-optimized title (60 characters max)
- excerpt: Compelling excerpt (150-200 words)
- content: Full article content in HTML format
- metaTitle: SEO meta title (60 characters max)
- metaDescription: Meta description (150-160 characters)
- slug: URL-friendly slug
- focusKeyword: Primary keyword
- targetKeywords: Array of target keywords used

Make it authoritative, helpful, and specifically targeted at GCSE students and their parents seeking tutoring support.`;

    // Generate content with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content writer specializing in GCSE tutoring and student success. Create SEO-optimized, engaging blog content that helps students and parents.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const aiResponse = await response.json();

    if (!aiResponse.choices?.[0]?.message?.content) {
      throw new Error('Failed to generate content from AI');
    }

    let generatedContent;
    try {
      generatedContent = JSON.parse(aiResponse.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse.choices[0].message.content);
      throw new Error('AI response was not in expected JSON format');
    }

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

    // Create blog post
    const { data: blogPost, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: generatedContent.title,
        slug: slug,
        excerpt: generatedContent.excerpt,
        content: generatedContent.content,
        category_id: categoryId,
        status: 'draft',
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (postError) {
      throw new Error(`Failed to create blog post: ${postError.message}`);
    }

    // Create SEO data
    await supabase
      .from('blog_seo_data')
      .insert({
        post_id: blogPost.id,
        meta_title: generatedContent.metaTitle || generatedContent.title,
        meta_description: generatedContent.metaDescription,
        focus_keyword: generatedContent.focusKeyword || keywords[0],
        target_keywords: generatedContent.targetKeywords || keywords,
      });

    // Add tags to the post
    if (keywords.length > 0) {
      for (const keyword of keywords) {
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
        status: 'completed',
        generated_post_id: blogPost.id,
      })
      .eq('id', requestId);

    return new Response(
      JSON.stringify({
        success: true,
        blogPost: {
          id: blogPost.id,
          title: blogPost.title,
          slug: blogPost.slug,
          excerpt: blogPost.excerpt,
        },
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