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

    console.log('[SCIENCE] Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice });

    const generateLessonPlan = async ({
      topic,
      yearGroup,
      learningGoal,
      isExamPractice = false
    }: {
      topic: string;
      yearGroup: string;
      learningGoal: string;
      isExamPractice?: boolean;
    }) => {
      const prompt = `You are an expert teacher creating a lesson plan. The lesson plan should cover the topic: ${topic} for year ${yearGroup} students. The learning goal is: ${learningGoal}.

      The lesson plan should include:
      - A clear learning objective
      - A detailed teaching sequence with specific activities and timings
      - Suggestions for visual aids like tables, diagrams, or videos
      - Practice questions to test student understanding
      ${isExamPractice ? 'The lesson plan should focus on exam-style practice questions.' : ''}

      The lesson plan should be structured as follows:
      ### Learning Objective
      [The learning objective for the lesson]

      ### Teaching Sequence
      [Detailed teaching sequence with activities and timings]

      ### Visual Aids
      [Suggestions for visual aids]

      ### Practice Questions
      [Practice questions to test student understanding]

      Please provide the lesson plan in markdown format.`;

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      };

      const body = JSON.stringify({
        model: "mistralai/Mistral-medium",
        prompt: prompt,
        max_tokens: 2048,
      });

      const response = await fetch("https://api.lovable.ai/api/generate", {
        method: "POST",
        headers: headers,
        body: body,
      });

      const result = await response.json();
      return result.generation;
    };

    const generateExamQuestions = async ({
      topic,
      yearGroup,
      learningGoal
    }: {
      topic: string;
      yearGroup: string;
      learningGoal: string;
    }) => {
      const prompt = `You are an expert teacher creating exam-style practice questions for a lesson. The lesson covers the topic: ${topic} for year ${yearGroup} students. The learning goal is: ${learningGoal}.

      Please provide a variety of exam-style practice questions, including multiple choice, short answer, and extended response questions.

      The practice questions should be structured as follows:
      ### Multiple Choice Questions
      [Multiple choice questions with answers]

      ### Short Answer Questions
      [Short answer questions with model answers]

      ### Extended Response Questions
      [Extended response questions with guidance on what to include in the answer]

      Please provide the practice questions in markdown format.`;

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      };

      const body = JSON.stringify({
        model: "mistralai/Mistral-medium",
        prompt: prompt,
        max_tokens: 2048,
      });

      const response = await fetch("https://api.lovable.ai/api/generate", {
        method: "POST",
        headers: headers,
        body: body,
      });

      const result = await response.json();
      return result.generation;
    };

    const generateVisualAids = async ({
      topic,
      yearGroup,
      learningGoal
    }: {
      topic: string;
      yearGroup: string;
      learningGoal: string;
    }) => {
      const prompt = `You are an expert teacher suggesting visual aids for a lesson. The lesson covers the topic: ${topic} for year ${yearGroup} students. The learning goal is: ${learningGoal}.

      Please provide suggestions for visual aids, including tables, diagrams, videos, and interactive simulations. For each visual aid, provide a brief description of how it can be used in the lesson.

      The visual aids should be structured as follows:
      ### Tables
      [Suggestions for tables with descriptions]

      ### Diagrams
      [Suggestions for diagrams with descriptions]

      ### Videos
      [Suggestions for videos with descriptions and links]

       ### Interactive Simulations
      [Suggestions for interactive simulations with descriptions and links]

      Please provide the visual aids in markdown format.`;

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      };

      const body = JSON.stringify({
        model: "mistralai/Mistral-medium",
        prompt: prompt,
        max_tokens: 2048,
      });

      const response = await fetch("https://api.lovable.ai/api/generate", {
        method: "POST",
        headers: headers,
        body: body,
      });

      const result = await response.json();
      return result.generation;
    };

    // Generate the lesson plan
    let lessonPlan = await generateLessonPlan({ topic, yearGroup, learningGoal, isExamPractice });

    // Generate exam questions if isExamPractice is true
    if (isExamPractice) {
      const examQuestions = await generateExamQuestions({ topic, yearGroup, learningGoal });
      lessonPlan += `\n\n## Exam Practice Questions\n${examQuestions}`;
    }

    // Generate visual aids
    const visualAids = await generateVisualAids({ topic, yearGroup, learningGoal });
    lessonPlan += `\n\n## Visual Aids\n${visualAids}`;

    // Store the lesson plan in Supabase
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plans')
      .insert([
        {
          topic: topic,
          year_group: yearGroup,
          learning_goal: learningGoal,
          content: lessonPlan,
          created_by: user.id,
          conversation_id: conversationId,
        }
      ])
      .select('id')

    if (lessonPlanError) {
      console.error('Error storing lesson plan:', lessonPlanError);
      throw new Error(lessonPlanError.message || 'Failed to store lesson plan');
    }

    const lessonPlanId = lessonPlanData[0].id;

    // If lessonId is provided, create a course lesson
    if (lessonId) {
      const { error: courseLessonError } = await supabase
        .from('course_lessons')
        .update({
          lesson_plan_id: lessonPlanId,
        })
        .eq('id', lessonId);

      if (courseLessonError) {
        console.error('Error updating course lesson:', courseLessonError);
        throw new Error(courseLessonError.message || 'Failed to update course lesson');
      }
    }

    return new Response(
      JSON.stringify({ lessonPlanId: lessonPlanId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SCIENCE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
