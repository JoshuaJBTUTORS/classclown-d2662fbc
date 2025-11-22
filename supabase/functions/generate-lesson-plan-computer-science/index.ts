import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please sign in to generate lesson plans' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice = false } = await req.json();

    console.log('[COMPUTER SCIENCE] Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice });

    const generateLessonPlan = async ({
      topic,
      yearGroup,
      learningGoal,
      isExamPractice
    }: {
      topic: string;
      yearGroup: string;
      learningGoal?: string;
      isExamPractice?: boolean;
    }) => {
      const prompt = `You are an expert teacher creating a lesson plan. The lesson plan should cover the topic: ${topic}, for year group: ${yearGroup}. ${learningGoal ? `The learning goal is: ${learningGoal}.` : ''} ${isExamPractice ? 'This lesson plan is for exam practice.' : ''}

      The lesson plan should include:
      - Learning objectives
      - Success criteria
      - A detailed teaching sequence, including specific activities and timings
      - Visual diagrams and tables where appropriate
      - Practice questions with varying difficulty levels

      The lesson plan should be structured as follows:
      1. Title: [Title of the lesson plan]
      2. Learning Objectives:
         - [Objective 1]
         - [Objective 2]
         - ...
      3. Success Criteria:
         - [Criterion 1]
         - [Criterion 2]
         - ...
      4. Teaching Sequence:
         - [Time]: [Activity] - [Description]
         - [Time]: [Activity] - [Description]
         - ...
      5. Visual Diagrams and Tables:
         - [Description of diagram/table and its purpose]
         - ...
      6. Practice Questions:
         - [Question 1] - [Difficulty Level]
         - [Question 2] - [Difficulty Level]
         - ...

      Ensure the lesson plan is comprehensive, engaging, and tailored to the specified year group and topic. Be creative and incorporate a variety of teaching methods to cater to different learning styles.
      `;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText, await response.text());
        throw new Error(`OpenAI API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const lessonPlan = data.choices[0].message.content;
      return lessonPlan;
    };

    const generateImages = async (lessonPlan: string) => {
      const prompt = `Extract all the tables and diagrams from the following lesson plan and generate a prompt for each to generate an image using DALL-E 3.
      The lesson plan is:
      ${lessonPlan}

      Return the prompts as a JSON array. For example:
      [
        {
          "description": "A table showing the different types of chemical reactions",
          "prompt": "A table showing the different types of chemical reactions, with columns for reaction type, reactants, products, and examples. The table should be colorful and easy to read."
        },
        {
          "description": "A diagram of the water cycle",
          "prompt": "A diagram of the water cycle, showing evaporation, condensation, precipitation, and collection. The diagram should be colorful and easy to understand."
        }
      ]
      `;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 4096,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText, await response.text());
        throw new Error(`OpenAI API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const imagePrompts = data.choices[0].message.content;
      return imagePrompts;
    };

    const generateTitle = async (topic: string, yearGroup: string) => {
      const prompt = `You are an expert teacher creating a title for a lesson plan. The lesson plan is for the topic: ${topic}, for year group: ${yearGroup}.

      Suggest three different titles for the lesson plan.

      Return the titles as a JSON array. For example:
      [
        "Title 1",
        "Title 2",
        "Title 3"
      ]
      `;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText, await response.text());
        throw new Error(`OpenAI API request failed with status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const titles = data.choices[0].message.content;
      return titles;
    };

    const lessonPlanContent = await generateLessonPlan({ topic, yearGroup, learningGoal, isExamPractice });
    const imagePrompts = await generateImages(lessonPlanContent);
    const titles = await generateTitle(topic, yearGroup);

    // Store the lesson plan in the database
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plans')
      .insert([
        {
          topic,
          year_group: yearGroup,
          learning_goal: learningGoal,
          content: lessonPlanContent,
          image_prompts: imagePrompts,
          suggested_titles: titles,
          conversation_id: conversationId,
          created_by: user.id,
          is_exam_practice: isExamPractice,
        }
      ])
      .select()

    if (lessonPlanError) {
      console.error('Supabase Error:', lessonPlanError);
      throw new Error(lessonPlanError.message);
    }

    const lessonPlanId = lessonPlanData[0].id;

    // If a lessonId was provided, create a course lesson
    if (lessonId) {
      const { data: courseLessonData, error: courseLessonError } = await supabase
        .from('course_lessons')
        .update({
          lesson_plan_id: lessonPlanId
        })
        .eq('id', lessonId)
        .select()

      if (courseLessonError) {
        console.error('Supabase Error:', courseLessonError);
        throw new Error(courseLessonError.message);
      }

      console.log('Course lesson updated:', courseLessonData);
    }

    return new Response(
      JSON.stringify({ lessonPlanId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[COMPUTER SCIENCE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
