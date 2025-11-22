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

    console.log('[MATHS] Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice });

    const generateLessonPlan = async ({
      topic,
      yearGroup,
      learningGoal,
      isExamPractice
    }: {
      topic: string;
      yearGroup: string;
      learningGoal: string;
      isExamPractice: boolean;
    }) => {
      const prompt = `You are an expert teacher, designing an engaging and informative lesson plan.
      The lesson plan should cover the topic "${topic}" for year group "${yearGroup}".
      The learning goal is: "${learningGoal}".
      
      ${isExamPractice ? "This lesson plan should focus on exam practice questions." : ""}

      The lesson plan should include:
      - Clear learning objectives
      - A detailed teaching sequence with timings
      - Suggestions for visual aids like tables and diagrams
      - Practice questions to test understanding

      The lesson plan should be structured as follows:

      ### Learning Objectives
      [List the key learning objectives for the lesson]

      ### Teaching Sequence
      [Provide a detailed sequence of teaching activities, including timings for each activity. Be very specific.]

      ### Visual Aids
      [Suggest specific tables, diagrams, or other visuals that could enhance understanding]

      ### Practice Questions
      [Include a variety of practice questions that align with the learning objectives. Include the answers.]

      Now generate the lesson plan:`;

      const response = await fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': lovableApiKey
        },
        body: JSON.stringify({
          enable_google_results: false,
          enable_memory: false,
          input_text: prompt
        })
      });

      const data = await response.json();
      const lessonPlan = data.message;
      return lessonPlan;
    };

    const generateExamPractice = async ({
      topic,
      yearGroup,
      learningGoal
    }: {
      topic: string;
      yearGroup: string;
      learningGoal: string;
    }) => {
      const prompt = `You are an expert teacher creating exam practice questions.
      Create exam-style practice questions for the topic "${topic}" for year group "${yearGroup}".
      The learning goal is: "${learningGoal}".

      The practice questions should:
      - Be relevant to the topic and learning goal
      - Be challenging and engaging
      - Include a variety of question types
      - Include detailed answers and explanations

      The practice questions should be structured as follows:

      ### Exam Practice Questions
      [Include a variety of exam-style practice questions]

      ### Answers and Explanations
      [Provide detailed answers and explanations for each question]

      Now generate the exam practice questions:`;

      const response = await fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': lovableApiKey
        },
        body: JSON.stringify({
          enable_google_results: false,
          enable_memory: false,
          input_text: prompt
        })
      });

      const data = await response.json();
      const examPractice = data.message;
      return examPractice;
    };

    const generateDiagram = async ({
      topic,
      yearGroup,
      learningGoal
    }: {
      topic: string;
      yearGroup: string;
      learningGoal: string;
    }) => {
      const prompt = `You are an expert teacher suggesting diagrams for a lesson.
      Suggest a visual diagram for the topic "${topic}" for year group "${yearGroup}".
      The learning goal is: "${learningGoal}".

      The diagram should:
      - Be relevant to the topic and learning goal
      - Be clear and easy to understand
      - Enhance understanding of the topic

      The diagram suggestion should be structured as follows:

      ### Diagram Suggestion
      [Suggest a specific diagram that could enhance understanding]

      ### Explanation
      [Explain how the diagram relates to the topic and learning goal]

      Now generate the diagram suggestion:`;

      const response = await fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': lovableApiKey
        },
        body: JSON.stringify({
          enable_google_results: false,
          enable_memory: false,
          input_text: prompt
        })
      });

      const data = await response.json();
      const diagramSuggestion = data.message;
      return diagramSuggestion;
    };

    // Generate the lesson plan
    let lessonPlan = "";
    if (isExamPractice) {
      lessonPlan = await generateExamPractice({ topic, yearGroup, learningGoal });
    } else {
      lessonPlan = await generateLessonPlan({ topic, yearGroup, learningGoal, isExamPractice });
    }
    const diagramSuggestion = await generateDiagram({ topic, yearGroup, learningGoal });

    // Store the lesson plan in Supabase
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plans')
      .insert([
        {
          topic: topic,
          year_group: yearGroup,
          learning_goal: learningGoal,
          content: lessonPlan,
          diagram_suggestion: diagramSuggestion,
          created_by: user.id,
          conversation_id: conversationId
        }
      ])
      .select()

    if (lessonPlanError) {
      console.error('Supabase error:', lessonPlanError);
      throw new Error('Failed to save lesson plan to Supabase');
    }

    const lessonPlanId = lessonPlanData[0].id;

    // Update the conversation with the lesson plan ID
    if (conversationId) {
      const { error: conversationError } = await supabase
        .from('conversations')
        .update({ lesson_plan_id: lessonPlanId })
        .eq('id', conversationId);

      if (conversationError) {
        console.error('Supabase error:', conversationError);
        throw new Error('Failed to update conversation with lesson plan ID');
      }
    }

    return new Response(
      JSON.stringify({ lessonPlanId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[MATHS] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
