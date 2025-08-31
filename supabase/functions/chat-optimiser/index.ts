import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();

    // Check if user has admin/owner role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'owner']);

    if (roleError || !userRoles?.length) {
      return new Response(JSON.stringify({ error: 'Unauthorized access' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get context data for AI
    const [studentsResult, tutorsResult, subjectsResult] = await Promise.all([
      supabase.from('students').select('id, first_name, last_name, grade').eq('status', 'active'),
      supabase.from('tutors').select('id, first_name, last_name, specialities').eq('status', 'active'),
      supabase.from('subjects').select('id, name, category')
    ]);

    const students = studentsResult.data || [];
    const tutors = tutorsResult.data || [];
    const subjects = subjectsResult.data || [];

    // Create context for AI
    const context = {
      students: students.map(s => `${s.first_name} ${s.last_name} (Grade: ${s.grade || 'N/A'})`),
      tutors: tutors.map(t => `${t.first_name} ${t.last_name} (Specialities: ${t.specialities?.join(', ') || 'N/A'})`),
      subjects: subjects.map(s => s.name)
    };

    const systemPrompt = `You are an AI assistant for a tutoring company's lesson management system. 
Your job is to help administrators find and search for lessons based on natural language queries.

Available data:
Students: ${context.students.join(', ')}
Tutors: ${context.tutors.join(', ')}
Subjects: ${context.subjects.join(', ')}

When a user asks about lessons, parse their query and respond with:
1. A natural language acknowledgment of what they're looking for
2. JSON search parameters in this format:
{
  "searchParams": {
    "studentNames": ["extracted student names"],
    "tutorNames": ["extracted tutor names"], 
    "subjects": ["extracted subjects"],
    "grades": ["extracted grade levels like 'year 11', 'gcse', 'a-level'"],
    "dateRange": "extracted date range if mentioned",
    "timeRange": "extracted time range if mentioned"
  }
}

Example:
User: "Find GCSE English lessons for year 11 with Liberty"
Response: "I'll search for GCSE English lessons for year 11 students with Liberty as either the student or tutor.

{
  "searchParams": {
    "studentNames": ["Liberty"],
    "tutorNames": ["Liberty"],
    "subjects": ["English"],
    "grades": ["year 11", "gcse"],
    "dateRange": "",
    "timeRange": ""
  }
}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    // Extract JSON from AI response
    let searchParams = {};
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        searchParams = jsonData.searchParams || {};
      }
    } catch (e) {
      console.log('Could not parse JSON from AI response:', e);
    }

    // Search for lessons based on parsed parameters
    let lessonsQuery = supabase
      .from('lessons')
      .select(`
        *,
        tutors!inner(id, first_name, last_name, specialities),
        lesson_students!inner(
          student_id,
          students!inner(id, first_name, last_name, grade)
        )
      `)
      .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('start_time', { ascending: false });

    // Apply filters based on search params
    if (searchParams.subjects?.length > 0) {
      lessonsQuery = lessonsQuery.in('subject', searchParams.subjects);
    }

    const { data: lessons, error: lessonsError } = await lessonsQuery;

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
    }

    // Filter lessons based on student/tutor names and other criteria
    let filteredLessons = lessons || [];
    
    if (searchParams.studentNames?.length > 0 || searchParams.tutorNames?.length > 0) {
      filteredLessons = filteredLessons.filter(lesson => {
        const tutorMatch = searchParams.tutorNames?.some(name => 
          lesson.tutors?.first_name?.toLowerCase().includes(name.toLowerCase()) ||
          lesson.tutors?.last_name?.toLowerCase().includes(name.toLowerCase())
        );
        
        const studentMatch = searchParams.studentNames?.some(name =>
          lesson.lesson_students?.some(ls =>
            ls.students?.first_name?.toLowerCase().includes(name.toLowerCase()) ||
            ls.students?.last_name?.toLowerCase().includes(name.toLowerCase())
          )
        );

        return tutorMatch || studentMatch;
      });
    }

    // Limit results
    filteredLessons = filteredLessons.slice(0, 10);

    return new Response(JSON.stringify({
      aiResponse: aiResponse.replace(/\{[\s\S]*\}/, '').trim(),
      lessons: filteredLessons,
      searchParams
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chat-optimiser:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      aiResponse: "I'm sorry, I encountered an error processing your request. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});