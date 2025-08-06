import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { action, lessonId, transcriptionId } = await req.json();

    switch (action) {
      case 'get-transcription':
        return await getTranscription(lessonId);
      case 'generate-summaries':
        return await generateStudentSummaries(lessonId, transcriptionId);
      case 'poll-transcriptions':
        return await pollPendingTranscriptions();
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error) {
    console.error('Error in generate-lesson-summaries function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function getTranscription(lessonId: string) {
  console.log(`Getting transcription for lesson: ${lessonId}`);

  // Get lesson details with session ID
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('lesson_space_session_id, title')
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson?.lesson_space_session_id) {
    console.error('Error fetching lesson or no session ID:', lessonError);
    return new Response(
      JSON.stringify({ error: 'Lesson not found or no session ID available' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const sessionId = lesson.lesson_space_session_id;

  // Check if we already have a transcription record
  const { data: existingTranscription, error: transcriptionError } = await supabase
    .from('lesson_transcriptions')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('session_id', sessionId)
    .single();

  if (transcriptionError && transcriptionError.code !== 'PGRST116') {
    console.error('Error checking existing transcription:', transcriptionError);
    return new Response(
      JSON.stringify({ error: 'Failed to check transcription status' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // If we have a transcription that's available and not expired, return it
  if (existingTranscription && 
      existingTranscription.transcription_status === 'available' && 
      existingTranscription.expires_at && 
      new Date(existingTranscription.expires_at) > new Date()) {
    return new Response(
      JSON.stringify({
        success: true,
        transcription: existingTranscription
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Fetch transcription from LessonSpace API
  try {
    const lessonSpaceApiKey = Deno.env.get('LESSONSPACE_API_KEY');
    if (!lessonSpaceApiKey) {
      throw new Error('LessonSpace API key not configured');
    }

    console.log(`Fetching transcription from LessonSpace for session: ${sessionId}`);
    
    const transcriptionResponse = await fetch(
      `https://api.thelessonspace.com/v2/organisations/20704/sessions/${sessionId}/transcript/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Organisation ${lessonSpaceApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`LessonSpace API response status: ${transcriptionResponse.status} for session: ${sessionId}`);

    if (!transcriptionResponse.ok) {
      if (transcriptionResponse.status === 404) {
        // Transcription not ready yet
        await upsertTranscriptionRecord(lessonId, sessionId, 'processing');
        return new Response(
          JSON.stringify({ 
            success: false, 
            status: 'processing',
            message: 'Transcription is still being processed' 
          }),
          { 
            status: 202,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw new Error(`LessonSpace API error: ${transcriptionResponse.status}`);
    }

    const transcriptionData = await transcriptionResponse.json();
    
    if (transcriptionData.transcriptionUrl) {
      // Transcription is available
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
      
      const { data: updatedTranscription, error: updateError } = await upsertTranscriptionRecord(
        lessonId, 
        sessionId, 
        'available', 
        transcriptionData.transcriptionUrl,
        null,
        expiresAt
      );

      if (updateError) {
        console.error('Error updating transcription record:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          transcription: updatedTranscription
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      // Transcription still processing
      await upsertTranscriptionRecord(lessonId, sessionId, 'processing');
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: 'processing',
          message: 'Transcription is still being processed' 
        }),
        { 
          status: 202,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error fetching transcription from LessonSpace:', error);
    await upsertTranscriptionRecord(lessonId, sessionId, 'error');
    return new Response(
      JSON.stringify({ error: 'Failed to fetch transcription from LessonSpace' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function upsertTranscriptionRecord(
  lessonId: string, 
  sessionId: string, 
  status: string, 
  transcriptionUrl?: string,
  transcriptionText?: string,
  expiresAt?: Date
) {
  const updateData: any = {
    lesson_id: lessonId,
    session_id: sessionId,
    transcription_status: status,
    updated_at: new Date().toISOString()
  };

  if (transcriptionUrl) updateData.transcription_url = transcriptionUrl;
  if (transcriptionText) updateData.transcription_text = transcriptionText;
  if (expiresAt) updateData.expires_at = expiresAt.toISOString();

  const { data, error } = await supabase
    .from('lesson_transcriptions')
    .upsert(updateData, { 
      onConflict: 'lesson_id,session_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  return { data, error };
}

async function generateStudentSummaries(lessonId: string, transcriptionId: string) {
  console.log(`Generating student summaries for lesson: ${lessonId}, transcription: ${transcriptionId}`);

  // Get transcription details
  const { data: transcription, error: transcriptionError } = await supabase
    .from('lesson_transcriptions')
    .select('transcription_text, transcription_url')
    .eq('id', transcriptionId)
    .single();

  if (transcriptionError || !transcription) {
    console.error('Error fetching transcription:', transcriptionError);
    return new Response(
      JSON.stringify({ error: 'Transcription not found' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Get lesson details and students
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      subject,
      lesson_students!inner(
        student:students(
          id,
          first_name,
          last_name
        )
      )
    `)
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson) {
    console.error('Error fetching lesson details:', lessonError);
    return new Response(
      JSON.stringify({ error: 'Lesson not found' }),
      { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  let transcriptionText = transcription.transcription_text;

  // If we don't have the text but have a URL, fetch it
  if (!transcriptionText && transcription.transcription_url) {
    try {
      console.log(`Fetching transcription from URL: ${transcription.transcription_url}`);
      const textResponse = await fetch(transcription.transcription_url);
      if (textResponse.ok) {
        const transcriptionData = await textResponse.json();
        console.log('LessonSpace transcription JSON structure:', JSON.stringify(transcriptionData, null, 2));
        
        // Extract transcript text from the JSON structure
        // LessonSpace typically stores transcripts in a 'transcript' or 'text' field
        if (transcriptionData.transcript) {
          transcriptionText = transcriptionData.transcript;
        } else if (transcriptionData.text) {
          transcriptionText = transcriptionData.text;
        } else if (transcriptionData.transcription) {
          transcriptionText = transcriptionData.transcription;
        } else if (typeof transcriptionData === 'string') {
          transcriptionText = transcriptionData;
        } else {
          console.error('Unknown transcription JSON structure:', transcriptionData);
          transcriptionText = JSON.stringify(transcriptionData);
        }
        
        console.log(`Extracted transcription text (first 200 chars): ${transcriptionText?.substring(0, 200)}...`);
        
        // Save the text to our database
        await supabase
          .from('lesson_transcriptions')
          .update({ transcription_text: transcriptionText })
          .eq('id', transcriptionId);
      } else {
        console.error(`Failed to fetch transcription URL. Status: ${textResponse.status}`);
      }
    } catch (error) {
      console.error('Error fetching transcription text:', error);
    }
  }

  if (!transcriptionText) {
    return new Response(
      JSON.stringify({ error: 'Transcription text not available' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const students = lesson.lesson_students.map((ls: any) => ls.student);
  const summaries = [];

  // Generate AI summary for each student
  for (const student of students) {
    try {
      const studentName = `${student.first_name} ${student.last_name}`;
      
      const prompt = `
Analyze the following lesson transcription and provide a detailed summary for student "${studentName}".

Lesson Details:
- Title: ${lesson.title}
- Subject: ${lesson.subject || 'Not specified'}

Transcription:
${transcriptionText}

Please provide a comprehensive analysis focusing on:

1. **Topics Covered**: List the main topics and concepts discussed during the lesson
2. **Student Contributions**: Identify and describe ${studentName}'s specific contributions, questions, answers, and participation
3. **What Went Well**: Highlight ${studentName}'s strengths, good understanding, correct answers, and positive engagement
4. **Areas for Improvement**: Identify concepts ${studentName} struggled with, incorrect answers, or areas needing more attention
5. **Engagement Level**: Rate and describe ${studentName}'s overall engagement (Low/Medium/High) with specific examples
6. **Overall Summary**: Provide a comprehensive overview of ${studentName}'s performance and learning in this lesson

Please be specific and provide examples from the transcription. If ${studentName} is not mentioned in the transcription, note their absence or lack of participation.

Format your response as a JSON object with the following structure:
{
  "topics_covered": ["topic1", "topic2", "topic3"],
  "student_contributions": "detailed description",
  "what_went_well": "positive aspects",
  "areas_for_improvement": "areas needing attention",
  "engagement_level": "Low|Medium|High",
  "overall_summary": "comprehensive summary"
}
`;

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'o3-2025-04-16',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert educational analyst. Analyze lesson transcriptions to provide detailed, constructive feedback for individual students. Always respond with valid JSON.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!openAIResponse.ok) {
        console.error(`OpenAI API error for student ${studentName}:`, openAIResponse.status);
        continue;
      }

      const aiResponse = await openAIResponse.json();
      const aiContent = aiResponse.choices[0]?.message?.content;

      if (!aiContent) {
        console.error(`No AI response for student ${studentName}`);
        continue;
      }

      let analysisData;
      try {
        // Strip markdown code blocks if present
        let cleanContent = aiContent.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        console.log(`Attempting to parse JSON for student ${studentName}:`, cleanContent);
        analysisData = JSON.parse(cleanContent);
        console.log(`Successfully parsed JSON for student ${studentName}:`, analysisData);
      } catch (parseError) {
        console.error(`Failed to parse AI response for student ${studentName}:`, parseError);
        console.error('Raw AI content:', aiContent);
        // Fallback to storing the raw response
        analysisData = {
          topics_covered: [],
          student_contributions: "AI analysis failed to parse",
          what_went_well: "Unable to analyze",
          areas_for_improvement: "Unable to analyze", 
          engagement_level: "Unknown",
          overall_summary: aiContent
        };
      }

      // Save the summary to the database with proper field mapping
      const summaryData = {
        lesson_id: lessonId,
        student_id: student.id,
        transcription_id: transcriptionId,
        topics_covered: analysisData.topics_covered || [],
        student_contributions: analysisData.student_contributions || '',
        what_went_well: analysisData.what_went_well || '',
        areas_for_improvement: analysisData.areas_for_improvement || '',
        engagement_level: analysisData.engagement_level || 'Unknown',
        ai_summary: analysisData.overall_summary || aiContent,
      };

      console.log(`Saving summary for student ${studentName}:`, summaryData);

      const { data: summary, error: summaryError } = await supabase
        .from('lesson_student_summaries')
        .upsert(summaryData, {
          onConflict: 'lesson_id,student_id,transcription_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (summaryError) {
        console.error(`Error saving summary for student ${studentName}:`, summaryError);
      } else {
        summaries.push({
          student: student,
          summary: summary
        });
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error generating summary for student ${student.first_name} ${student.last_name}:`, error);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      summaries_generated: summaries.length,
      total_students: students.length,
      summaries: summaries
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function pollPendingTranscriptions() {
  console.log('Polling for pending transcriptions...');

  // Get all processing transcriptions that haven't been updated in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const { data: pendingTranscriptions, error } = await supabase
    .from('lesson_transcriptions')
    .select('id, lesson_id, session_id, updated_at')
    .eq('transcription_status', 'processing')
    .lt('updated_at', fiveMinutesAgo.toISOString())
    .limit(10);

  if (error) {
    console.error('Error fetching pending transcriptions:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch pending transcriptions' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const results = [];
  
  for (const transcription of pendingTranscriptions || []) {
    try {
      // FIXED: Use direct getTranscription call instead of recursive function invoke
      // to prevent infinite recursion
      const transcriptionResult = await getTranscription(transcription.lesson_id);

      results.push({
        transcriptionId: transcription.id,
        lessonId: transcription.lesson_id,
        result: transcriptionResult
      });
    } catch (error) {
      console.error(`Error polling transcription ${transcription.id}:`, error);
      results.push({
        transcriptionId: transcription.id,
        lessonId: transcription.lesson_id,
        error: error.message
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      checked: results.length,
      results: results
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}