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

// Helper function to handle availability queries
async function handleAvailabilityQuery(searchParams, aiResponse, corsHeaders, supabase) {
  try {
    const tutorNames = searchParams.tutorNames || [];
    const dayFilter = searchParams.dayFilter || '';
    
    if (tutorNames.length === 0) {
      return new Response(JSON.stringify({
        aiResponse: "Please specify which tutor's availability you'd like to check.",
        availabilitySlots: [],
        searchParams
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the tutor
    const { data: tutors, error: tutorError } = await supabase
      .from('tutors')
      .select('id, first_name, last_name')
      .or(tutorNames.map(name => 
        `first_name.ilike.%${name}%,last_name.ilike.%${name}%`
      ).join(','));

    if (tutorError || !tutors?.length) {
      return new Response(JSON.stringify({
        aiResponse: `I couldn't find a tutor named ${tutorNames.join(' or ')}.`,
        availabilitySlots: [],
        searchParams
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tutor = tutors[0];

    // Get tutor's availability schedule
    const { data: availability, error: availError } = await supabase
      .from('tutor_availability')
      .select('day_of_week, start_time, end_time')
      .eq('tutor_id', tutor.id);

    if (availError) {
      console.error('Error fetching availability:', availError);
      return new Response(JSON.stringify({
        aiResponse: "Sorry, I couldn't retrieve the availability schedule.",
        availabilitySlots: [],
        searchParams
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter availability by day if specified
    let filteredAvailability = availability || [];
    if (dayFilter.toLowerCase().includes('weekend')) {
      filteredAvailability = filteredAvailability.filter(slot => 
        slot.day_of_week === 'saturday' || slot.day_of_week === 'sunday'
      );
    }

    if (filteredAvailability.length === 0) {
      const dayText = dayFilter.toLowerCase().includes('weekend') ? 'on weekends' : '';
      return new Response(JSON.stringify({
        aiResponse: `${tutor.first_name} ${tutor.last_name} has no availability scheduled ${dayText}.`,
        availabilitySlots: [],
        searchParams
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get upcoming lessons for the next 2 weeks
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14);

    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('start_time, end_time, title')
      .eq('tutor_id', tutor.id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .in('status', ['scheduled', 'in_progress']);

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
    }

    // Calculate available time slots
    const availableSlots = [];
    const upcomingLessons = lessons || [];

    filteredAvailability.forEach(avail => {
      const dayName = avail.day_of_week.charAt(0).toUpperCase() + avail.day_of_week.slice(1);
      const startTime = avail.start_time.slice(0, 5); // Format HH:MM
      const endTime = avail.end_time.slice(0, 5);

      // Find next occurrence of this day
      const nextDate = getNextDayOfWeek(startDate, avail.day_of_week);
      
      // Check if there are any lessons on this day and time
      const dayLessons = upcomingLessons.filter(lesson => {
        const lessonDate = new Date(lesson.start_time);
        const lessonDay = lessonDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        return lessonDay === avail.day_of_week;
      });

      const hasConflicts = dayLessons.some(lesson => {
        const lessonStart = new Date(lesson.start_time);
        const lessonEnd = new Date(lesson.end_time);
        const availStart = new Date(`${nextDate.toDateString()} ${avail.start_time}`);
        const availEnd = new Date(`${nextDate.toDateString()} ${avail.end_time}`);
        
        return (lessonStart < availEnd && lessonEnd > availStart);
      });

      availableSlots.push({
        day: dayName,
        date: nextDate.toDateString(),
        startTime,
        endTime,
        available: !hasConflicts,
        conflictingLessons: hasConflicts ? dayLessons.map(l => l.title) : []
      });
    });

    // Format response
    const freeSlots = availableSlots.filter(slot => slot.available);
    const busySlots = availableSlots.filter(slot => !slot.available);

    let responseText = `${tutor.first_name} ${tutor.last_name}'s availability`;
    if (dayFilter.toLowerCase().includes('weekend')) {
      responseText += ' over the weekend';
    }
    responseText += ':\n\n';

    if (freeSlots.length > 0) {
      responseText += '🟢 **Available Time Slots:**\n';
      freeSlots.forEach(slot => {
        responseText += `• ${slot.day}: ${slot.startTime} - ${slot.endTime}\n`;
      });
    }

    if (busySlots.length > 0) {
      responseText += '\n🔴 **Busy Time Slots:**\n';
      busySlots.forEach(slot => {
        responseText += `• ${slot.day}: ${slot.startTime} - ${slot.endTime} (${slot.conflictingLessons.join(', ')})\n`;
      });
    }

    if (freeSlots.length === 0 && busySlots.length === 0) {
      responseText += 'No availability found for the specified time period.';
    }

    return new Response(JSON.stringify({
      aiResponse: responseText,
      availabilitySlots: availableSlots,
      tutor: tutor,
      searchParams
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in availability query:', error);
    return new Response(JSON.stringify({
      aiResponse: "Sorry, I encountered an error checking availability.",
      availabilitySlots: [],
      searchParams
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Helper function to get next occurrence of a specific day
function getNextDayOfWeek(fromDate, dayName) {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());
  const currentDay = fromDate.getDay();
  
  let daysUntilTarget = (targetDay - currentDay + 7) % 7;
  if (daysUntilTarget === 0) daysUntilTarget = 7; // Next week if it's the same day
  
  const nextDate = new Date(fromDate);
  nextDate.setDate(fromDate.getDate() + daysUntilTarget);
  return nextDate;
}

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
You can handle two types of queries:

1. LESSON SEARCH: Find existing lessons matching criteria
2. AVAILABILITY SEARCH: Find available time slots for tutors

Available data:
Students: ${context.students.join(', ')}
Tutors: ${context.tutors.join(', ')}
Subjects: ${context.subjects.join(', ')}

For LESSON SEARCH queries, respond with:
{
  "queryType": "lessons",
  "searchParams": {
    "studentNames": ["extracted student names"],
    "tutorNames": ["extracted tutor names"], 
    "subjects": ["extracted subjects"],
    "grades": ["extracted grade levels"],
    "dateRange": "extracted date range if mentioned",
    "timeRange": "extracted time range if mentioned"
  }
}

For AVAILABILITY queries (when asking about "available", "free time", "when is X available", etc.), respond with:
{
  "queryType": "availability", 
  "searchParams": {
    "tutorNames": ["extracted tutor names"],
    "subjects": ["extracted subjects if mentioned"],
    "dayFilter": "extracted day filter (weekend, weekday, monday, etc.)",
    "timeFilter": "extracted time preference (morning, afternoon, evening)",
    "dateRange": "this week/next week/specific dates"
  }
}

Examples:
User: "Find GCSE English lessons for year 11 with Liberty"
Response: {
  "queryType": "lessons",
  "searchParams": {
    "studentNames": ["Liberty"],
    "tutorNames": ["Liberty"],
    "subjects": ["English"],
    "grades": ["year 11", "gcse"]
  }
}

User: "What time slots is Liberty available and not teaching over the weekend"
Response: {
  "queryType": "availability",
  "searchParams": {
    "tutorNames": ["Liberty"],
    "dayFilter": "weekend"
  }
}`;

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
    let queryType = 'lessons';
    
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        queryType = jsonData.queryType || 'lessons';
        searchParams = jsonData.searchParams || {};
      }
    } catch (e) {
      console.log('Could not parse JSON from AI response:', e);
    }

    // Handle availability queries
    if (queryType === 'availability') {
      return await handleAvailabilityQuery(searchParams, aiResponse, corsHeaders, supabase);
    }

    // Handle lesson search queries (existing logic)
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