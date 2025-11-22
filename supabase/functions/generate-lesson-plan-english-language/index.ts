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

    console.log('[ENGLISH LANGUAGE] Generating lesson plan:', { lessonId, topic, yearGroup, learningGoal, conversationId, isExamPractice });

    const generateLessonPlan = async (
      topic: string,
      yearGroup: string,
      learningGoal: string | undefined = undefined,
      isExamPractice: boolean = false
    ) => {
      const prompt = `You are an expert teacher designing a lesson plan.
      The lesson plan should cover the topic: ${topic} for year ${yearGroup} students.
      ${learningGoal ? `The learning goal is: ${learningGoal}.` : ""}
      ${isExamPractice ? "This lesson plan is for exam practice." : ""}
      
      The lesson plan should include:
      - Learning objectives
      - A detailed teaching sequence with timings
      - Visual aids or diagrams
      - Practice questions

      The lesson plan should be structured as follows:
      
      ### Learning Objectives
      [List the learning objectives]
      
      ### Teaching Sequence
      [Provide a detailed teaching sequence with timings for each activity]
      
      ### Visual Aids and Diagrams
      [Describe any visual aids or diagrams that could be used in the lesson]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the lesson plan is comprehensive, engaging, and tailored to the specified year group and topic.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate lesson plan from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const lessonPlan = data.choices[0].message.content;
      return lessonPlan;
    };

    const generateExamPractice = async (
      topic: string,
      yearGroup: string,
      learningGoal: string | undefined = undefined
    ) => {
      const prompt = `You are an expert teacher designing exam practice questions.
      The exam practice questions should cover the topic: ${topic} for year ${yearGroup} students.
      ${learningGoal ? `The learning goal is: ${learningGoal}.` : ""}
      
      The exam practice questions should include:
      - A variety of question types, including multiple choice, short answer, and essay questions
      - A detailed answer key with explanations for each question
      - A marking scheme for each question

      The exam practice questions should be structured as follows:
      
      ### Exam Practice Questions
      [Provide a set of exam practice questions that students can use to test their understanding]
      
      ### Answer Key
      [Provide a detailed answer key with explanations for each question]
      
      ### Marking Scheme
      [Provide a marking scheme for each question]
      
      Ensure the exam practice questions are comprehensive, challenging, and tailored to the specified year group and topic.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate exam practice questions from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const examPractice = data.choices[0].message.content;
      return examPractice;
    };

    const generateVisualDiagrams = async (
      topic: string,
      yearGroup: string,
      learningGoal: string | undefined = undefined
    ) => {
      const prompt = `You are an expert teacher designing visual diagrams.
      The visual diagrams should cover the topic: ${topic} for year ${yearGroup} students.
      ${learningGoal ? `The learning goal is: ${learningGoal}.` : ""}
      
      The visual diagrams should include:
      - A variety of diagrams, including charts, graphs, and illustrations
      - A detailed explanation of each diagram
      - A marking scheme for each diagram

      The visual diagrams should be structured as follows:
      
      ### Visual Diagrams
      [Provide a set of visual diagrams that students can use to test their understanding]
      
      ### Explanation of Diagrams
      [Provide a detailed explanation of each diagram]
      
      Ensure the visual diagrams are comprehensive, engaging, and tailored to the specified year group and topic.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate visual diagrams from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const visualDiagrams = data.choices[0].message.content;
      return visualDiagrams;
    };

    // Function to generate questions based on the lesson content
    const generateQuestions = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating questions based on the lesson content.
      The lesson content is: ${lessonContent}
      
      The questions should include:
      - A variety of question types, including multiple choice, short answer, and essay questions
      - A detailed answer key with explanations for each question
      - A marking scheme for each question

      The questions should be structured as follows:
      
      ### Questions
      [Provide a set of questions that students can use to test their understanding]
      
      ### Answer Key
      [Provide a detailed answer key with explanations for each question]
      
      ### Marking Scheme
      [Provide a marking scheme for each question]
      
      Ensure the questions are comprehensive, challenging, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate questions from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const questions = data.choices[0].message.content;
      return questions;
    };

    // Function to generate a summary of the lesson content
    const generateSummary = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating a summary of the lesson content.
      The lesson content is: ${lessonContent}
      
      The summary should include:
      - A brief overview of the main topics covered in the lesson
      - A list of the key concepts and vocabulary introduced in the lesson
      - A set of practice questions that students can use to test their understanding

      The summary should be structured as follows:
      
      ### Summary
      [Provide a brief overview of the main topics covered in the lesson]
      
      ### Key Concepts and Vocabulary
      [Provide a list of the key concepts and vocabulary introduced in the lesson]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the summary is comprehensive, concise, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate summary from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const summary = data.choices[0].message.content;
      return summary;
    };

    // Function to generate a set of keywords for the lesson content
    const generateKeywords = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating a set of keywords for the lesson content.
      The lesson content is: ${lessonContent}
      
      The keywords should include:
      - A list of the most important words and phrases from the lesson
      - A brief definition of each keyword
      - A set of practice questions that students can use to test their understanding

      The keywords should be structured as follows:
      
      ### Keywords
      [Provide a list of the most important words and phrases from the lesson]
      
      ### Definitions
      [Provide a brief definition of each keyword]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the keywords are comprehensive, concise, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate keywords from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const keywords = data.choices[0].message.content;
      return keywords;
    };

    // Function to generate a set of flashcards for the lesson content
    const generateFlashcards = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating a set of flashcards for the lesson content.
      The lesson content is: ${lessonContent}
      
      The flashcards should include:
      - A list of the most important words and phrases from the lesson
      - A brief definition of each keyword
      - A set of practice questions that students can use to test their understanding

      The flashcards should be structured as follows:
      
      ### Flashcards
      [Provide a list of the most important words and phrases from the lesson]
      
      ### Definitions
      [Provide a brief definition of each keyword]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the flashcards are comprehensive, concise, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate flashcards from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const flashcards = data.choices[0].message.content;
      return flashcards;
    };

    // Function to generate a set of quizzes for the lesson content
    const generateQuizzes = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating a set of quizzes for the lesson content.
      The lesson content is: ${lessonContent}
      
      The quizzes should include:
      - A list of the most important words and phrases from the lesson
      - A brief definition of each keyword
      - A set of practice questions that students can use to test their understanding

      The quizzes should be structured as follows:
      
      ### Quizzes
      [Provide a list of the most important words and phrases from the lesson]
      
      ### Definitions
      [Provide a brief definition of each keyword]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the quizzes are comprehensive, concise, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate quizzes from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const quizzes = data.choices[0].message.content;
      return quizzes;
    };

    // Function to generate a set of worksheets for the lesson content
    const generateWorksheets = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating a set of worksheets for the lesson content.
      The lesson content is: ${lessonContent}
      
      The worksheets should include:
      - A list of the most important words and phrases from the lesson
      - A brief definition of each keyword
      - A set of practice questions that students can use to test their understanding

      The worksheets should be structured as follows:
      
      ### Worksheets
      [Provide a list of the most important words and phrases from the lesson]
      
      ### Definitions
      [Provide a brief definition of each keyword]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the worksheets are comprehensive, concise, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate worksheets from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const worksheets = data.choices[0].message.content;
      return worksheets;
    };

    // Function to generate a set of activities for the lesson content
    const generateActivities = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating a set of activities for the lesson content.
      The lesson content is: ${lessonContent}
      
      The activities should include:
      - A list of the most important words and phrases from the lesson
      - A brief definition of each keyword
      - A set of practice questions that students can use to test their understanding

      The activities should be structured as follows:
      
      ### Activities
      [Provide a list of the most important words and phrases from the lesson]
      
      ### Definitions
      [Provide a brief definition of each keyword]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the activities are comprehensive, concise, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate activities from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const activities = data.choices[0].message.content;
      return activities;
    };

    // Function to generate a set of projects for the lesson content
    const generateProjects = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating a set of projects for the lesson content.
      The lesson content is: ${lessonContent}
      
      The projects should include:
      - A list of the most important words and phrases from the lesson
      - A brief definition of each keyword
      - A set of practice questions that students can use to test their understanding

      The projects should be structured as follows:
      
      ### Projects
      [Provide a list of the most important words and phrases from the lesson]
      
      ### Definitions
      [Provide a brief definition of each keyword]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the projects are comprehensive, concise, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate projects from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const projects = data.choices[0].message.content;
      return projects;
    };

    // Function to generate a set of assessments for the lesson content
    const generateAssessments = async (lessonContent: string) => {
      const prompt = `You are an expert teacher generating a set of assessments for the lesson content.
      The lesson content is: ${lessonContent}
      
      The assessments should include:
      - A list of the most important words and phrases from the lesson
      - A brief definition of each keyword
      - A set of practice questions that students can use to test their understanding

      The assessments should be structured as follows:
      
      ### Assessments
      [Provide a list of the most important words and phrases from the lesson]
      
      ### Definitions
      [Provide a brief definition of each keyword]
      
      ### Practice Questions
      [Provide a set of practice questions that students can use to test their understanding]
      
      Ensure the assessments are comprehensive, concise, and tailored to the lesson content.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4-1106-preview",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API Error:', response.status, response.statusText);
        const errorBody = await response.text();
        console.error('OpenAI API Error Body:', errorBody);
        throw new Error(`Failed to generate assessments from OpenAI API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const assessments = data.choices[0].message.content;
      return assessments;
    };

    const lessonPlan = await generateLessonPlan(topic, yearGroup, learningGoal, isExamPractice);
    //const examPractice = await generateExamPractice(topic, yearGroup, learningGoal);
    //const visualDiagrams = await generateVisualDiagrams(topic, yearGroup, learningGoal);
    //const questions = await generateQuestions(lessonPlan);
    //const summary = await generateSummary(lessonPlan);
    //const keywords = await generateKeywords(lessonPlan);
    //const flashcards = await generateFlashcards(lessonPlan);
    //const quizzes = await generateQuizzes(lessonPlan);
    //const worksheets = await generateWorksheets(lessonPlan);
    //const activities = await generateActivities(lessonPlan);
    //const projects = await generateProjects(lessonPlan);
    //const assessments = await generateAssessments(lessonPlan);

    // Store the lesson plan in Supabase
    const { data: lessonPlanData, error: lessonPlanError } = await supabase
      .from('lesson_plans')
      .insert({
        topic,
        year_group: yearGroup,
        learning_goal: learningGoal,
        content: lessonPlan,
        user_id: user.id,
        conversation_id: conversationId,
      })
      .select('id')
      .single();

    if (lessonPlanError) {
      console.error('Supabase Error:', lessonPlanError);
      throw new Error(`Failed to store lesson plan in Supabase: ${lessonPlanError.message}`);
    }

    // If a lessonId is provided, update the course_lessons table
    if (lessonId) {
      const { error: courseLessonsError } = await supabase
        .from('course_lessons')
        .update({
          lesson_plan_id: lessonPlanData.id,
        })
        .eq('id', lessonId);

      if (courseLessonsError) {
        console.error('Supabase Error:', courseLessonsError);
        throw new Error(`Failed to update course_lessons in Supabase: ${courseLessonsError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ lessonPlanId: lessonPlanData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ENGLISH LANGUAGE] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
