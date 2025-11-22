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

    console.log('[ENGLISH LITERATURE] Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice });

    const openaiApiUrl = 'https://api.openai.com/v1/chat/completions';

    const getSystemPrompt = (yearGroup: string, topic: string, learningGoal: string, isExamPractice: boolean) => {
      let prompt = `You are an expert teacher creating a detailed and engaging lesson plan for ${yearGroup} students on the topic of ${topic}. The learning goal is: ${learningGoal}.`;

      if (isExamPractice) {
        prompt += ` This lesson plan should focus specifically on exam practice, including relevant question types and strategies for success.`;
      }

      prompt += `
      The lesson plan should include:
      - A clear learning objective.
      - A detailed, step-by-step teaching sequence, including specific activities and timings for each step.
      - Suggestions for visual aids, tables, or diagrams to enhance understanding.
      - Practice questions to assess student learning.

      The format should be structured as follows:

      ## Learning Objective
      [A concise statement of what students will achieve]

      ## Teaching Sequence
      ### [Time]: [Activity]
      [Detailed description of the activity, including teacher instructions and student tasks]
      ... (repeat for each step in the sequence)

      ## Visual Aids/Tables/Diagrams
      [Suggestions for visuals to support learning]

      ## Practice Questions
      [A variety of questions to test understanding, including different question types if it is exam practice]

      Ensure the lesson plan is comprehensive, practical, and tailored to the specified year group and topic.
      `;

      return prompt;
    };

    const generateLessonPlan = async (prompt: string) => {
      try {
        const response = await fetch(openaiApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4-1106-preview",
            messages: [{ role: "system", content: prompt }],
            max_tokens: 3500,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          console.error('OpenAI API Error:', response.status, response.statusText);
          try {
            const errorBody = await response.json();
            console.error('OpenAI API Error Body:', JSON.stringify(errorBody));
          } catch (jsonError) {
            console.error('Failed to parse OpenAI error response as JSON.');
          }
          throw new Error(`OpenAI API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const lessonPlan = data.choices[0].message.content;
        return lessonPlan;

      } catch (error) {
        console.error('Error generating lesson plan:', error);
        throw error;
      }
    };

    const createDiagram = async (topic: string, description: string) => {
      try {
        const response = await fetch(openaiApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Create a visual diagram for ${topic}. The diagram should illustrate the following: ${description}. Please focus on clarity and educational value.`,
                  },
                ],
              },
            ],
            max_tokens: 1500,
          }),
        });

        if (!response.ok) {
          console.error('OpenAI API Error:', response.status, response.statusText);
          try {
            const errorBody = await response.json();
            console.error('OpenAI API Error Body:', JSON.stringify(errorBody));
          } catch (jsonError) {
            console.error('Failed to parse OpenAI error response as JSON.');
          }
          throw new Error(`OpenAI API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const diagramDescription = data.choices[0].message.content;
        return diagramDescription;

      } catch (error) {
        console.error('Error generating diagram description:', error);
        throw error;
      }
    };

    const generateExamQuestions = async (topic: string, yearGroup: string) => {
      try {
        const response = await fetch(openaiApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4-1106-preview",
            messages: [{
              role: "user",
              content: `Create exam-style practice questions for ${yearGroup} students studying ${topic}. Include a variety of question types, such as multiple choice, short answer, and essay questions. Also provide a detailed answer key.`
            }],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          console.error('OpenAI API Error:', response.status, response.statusText);
          try {
            const errorBody = await response.json();
            console.error('OpenAI API Error Body:', JSON.stringify(errorBody));
          } catch (jsonError) {
            console.error('Failed to parse OpenAI error response as JSON.');
          }
          throw new Error(`OpenAI API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const examQuestions = data.choices[0].message.content;
        return examQuestions;

      } catch (error) {
        console.error('Error generating exam questions:', error);
        throw error;
      }
    };

    const generateVisualAids = async (lessonPlan: string) => {
      try {
        const response = await fetch(openaiApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4-1106-preview",
            messages: [{
              role: "user",
              content: `Based on the following lesson plan, suggest specific visual aids, tables, or diagrams that would enhance student understanding. Provide a brief description of each visual aid and explain how it would be used in the lesson. ${lessonPlan}`
            }],
            max_tokens: 1500,
            temperature: 0.6,
          }),
        });

        if (!response.ok) {
          console.error('OpenAI API Error:', response.status, response.statusText);
          try {
            const errorBody = await response.json();
            console.error('OpenAI API Error Body:', JSON.stringify(errorBody));
          } catch (jsonError) {
            console.error('Failed to parse OpenAI error response as JSON.');
          }
          throw new Error(`OpenAI API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const visualAids = data.choices[0].message.content;
        return visualAids;

      } catch (error) {
        console.error('Error generating visual aids:', error);
        throw error;
      }
    };

    const saveLessonPlan = async (lessonPlan: string, visualAids: string, examQuestions: string) => {
      try {
        const { data, error } = await supabase
          .from('lesson_plans')
          .insert([
            {
              lesson_id: lessonId,
              topic: topic,
              year_group: yearGroup,
              learning_goal: learningGoal,
              content: lessonPlan,
              visual_aids: visualAids,
              exam_questions: isExamPractice ? examQuestions : null,
              conversation_id: conversationId,
              created_by: user.id,
            },
          ])
          .select('id')

        if (error) {
          console.error('Supabase Error:', error);
          throw new Error('Failed to save lesson plan to Supabase');
        }

        const lessonPlanId = data && data.length > 0 ? data[0].id : null;
        return lessonPlanId;

      } catch (error) {
        console.error('Error saving lesson plan:', error);
        throw error;
      }
    };

    // Main function execution
    const systemPrompt = getSystemPrompt(yearGroup, topic, learningGoal, isExamPractice);
    const lessonPlan = await generateLessonPlan(systemPrompt);
    const visualAids = await generateVisualAids(lessonPlan);
    const examQuestions = isExamPractice ? await generateExamQuestions(topic, yearGroup) : '';

    const lessonPlanId = await saveLessonPlan(lessonPlan, visualAids, examQuestions);

    return new Response(
      JSON.stringify({ lessonPlanId: lessonPlanId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ENGLISH LITERATURE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
