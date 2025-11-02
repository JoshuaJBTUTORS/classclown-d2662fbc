import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TopicInput {
  topic_name: string;
  description?: string;
  difficulty?: string;
  marks_per_question?: number;
}

interface CurriculumInput {
  subject: string;
  exam_board: string;
  year: number;
  topics: TopicInput[];
}

interface GenerationSettings {
  questions_per_topic: number;
  question_types?: string[];
  time_per_question?: number;
}

interface BulkRequest {
  curriculum: CurriculumInput;
  generation_settings: GenerationSettings;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rid = crypto.randomUUID();
  console.log(`[${rid}] Bulk assessment generation started`);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { curriculum, generation_settings }: BulkRequest = await req.json();
    const { topics } = curriculum;
    const questionsPerTopic = generation_settings.questions_per_topic || 20;

    console.log(`[${rid}] Processing ${topics.length} topics, ${questionsPerTopic} questions each`);

    const results = {
      total: topics.length,
      successful: 0,
      failed: 0,
      assessments: [] as any[],
      errors: [] as any[]
    };

    // Get user ID from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Process each topic sequentially
    for (let topicIndex = 0; topicIndex < topics.length; topicIndex++) {
      const topic = topics[topicIndex];
      const topicRid = `${rid}-topic-${topicIndex + 1}`;
      
      console.log(`[${topicRid}] Processing topic: ${topic.topic_name}`);

      try {
        // Create assessment record
        const { data: assessment, error: assessmentError } = await supabase
          .from('ai_assessments')
          .insert({
            title: topic.topic_name,
            description: topic.description || `Auto-generated assessment for ${topic.topic_name}`,
            subject: curriculum.subject,
            exam_board: curriculum.exam_board,
            year: curriculum.year,
            status: 'processing',
            processing_status: 'processing',
            created_by: userId,
            is_ai_generated: true,
            time_limit_minutes: (generation_settings.time_per_question || 3) * questionsPerTopic
          })
          .select()
          .single();

        if (assessmentError || !assessment) {
          throw new Error(`Failed to create assessment: ${assessmentError?.message}`);
        }

        console.log(`[${topicRid}] Created assessment ${assessment.id}`);

        // Generate questions using OpenAI
        const prompt = `You are creating ${questionsPerTopic} high-quality exam questions for the following specification:

Subject: ${curriculum.subject}
Exam Board: ${curriculum.exam_board}
Year: ${curriculum.year}
Topic: ${topic.topic_name}
${topic.description ? `Description: ${topic.description}` : ''}
${topic.difficulty ? `Difficulty Level: ${topic.difficulty}` : ''}

Create ${questionsPerTopic} varied questions that:
1. Focus specifically on "${topic.topic_name}"
2. Are unique and test different aspects of the topic
3. Vary in style (recall, application, analysis, problem-solving)
4. Are appropriate for ${curriculum.exam_board} specifications
5. Include clear marking schemes and keywords

Each question should be worth ${topic.marks_per_question || 3} marks.

Return ONLY a JSON array of ${questionsPerTopic} questions in this exact format:
[
  {
    "question_number": 1,
    "question_text": "The question text",
    "question_type": "short_answer" or "extended_writing" or "calculation",
    "correct_answer": "The correct answer or solution",
    "marks_available": number,
    "marking_scheme": {
      "criteria": ["mark criterion 1", "mark criterion 2"],
      "partial_marks": "Description of partial credit"
    },
    "keywords": ["keyword1", "keyword2"]
  }
]`;

        console.log(`[${topicRid}] Calling OpenAI API`);

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openAIApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are an expert exam question creator. Always respond with valid JSON only." },
              { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 4000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[${topicRid}] OpenAI API error: ${response.status} - ${errorText.substring(0, 500)}`);
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.choices[0].message.content;
        
        console.log(`[${topicRid}] Parsing OpenAI response`);

        // Clean and parse JSON
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith("```json")) {
          cleanedText = cleanedText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
        } else if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```\n?/, "").replace(/\n?```$/, "");
        }

        const questions = JSON.parse(cleanedText);

        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("Invalid questions format from OpenAI");
        }

        console.log(`[${topicRid}] Inserting ${questions.length} questions`);

        // Calculate total marks
        let totalMarks = 0;

        // Insert questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          
          const { error: questionError } = await supabase
            .from('assessment_questions')
            .insert({
              assessment_id: assessment.id,
              question_number: i + 1,
              position: i + 1,
              question_text: q.question_text,
              question_type: q.question_type || 'short_answer',
              correct_answer: q.correct_answer,
              marks_available: q.marks_available || topic.marks_per_question || 3,
              marking_scheme: q.marking_scheme || {},
              keywords: q.keywords || []
            });

          if (questionError) {
            console.error(`[${topicRid}] Error inserting question ${i + 1}:`, questionError);
          } else {
            totalMarks += (q.marks_available || topic.marks_per_question || 3);
          }
        }

        // Update assessment status
        await supabase
          .from('ai_assessments')
          .update({
            status: 'completed',
            processing_status: 'completed',
            total_marks: totalMarks,
            ai_confidence_score: 0.85
          })
          .eq('id', assessment.id);

        console.log(`[${topicRid}] Completed successfully - ${questions.length} questions, ${totalMarks} marks`);

        results.successful++;
        results.assessments.push({
          id: assessment.id,
          title: topic.topic_name,
          questions_count: questions.length,
          total_marks: totalMarks
        });

        // Add small delay between topics to avoid rate limits
        if (topicIndex < topics.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`[${topicRid}] Failed:`, error);
        
        results.failed++;
        results.errors.push({
          topic: topic.topic_name,
          error: error.message
        });

        // Try to update assessment status to failed if it was created
        try {
          await supabase
            .from('ai_assessments')
            .update({
              status: 'failed',
              processing_status: 'failed',
              processing_error: error.message
            })
            .eq('title', topic.topic_name)
            .eq('created_by', userId);
        } catch (updateError) {
          console.error(`[${topicRid}] Failed to update assessment status:`, updateError);
        }
      }
    }

    console.log(`[${rid}] Bulk generation completed: ${results.successful} successful, ${results.failed} failed`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[${rid}] Bulk generation error:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        rid 
      }),
      { 
        status: 200, // Return 200 so frontend can access error details
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
