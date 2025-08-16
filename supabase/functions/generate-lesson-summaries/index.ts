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

// Constants for transcript processing
const MAX_TRANSCRIPT_SIZE = 100000; // 100KB for single processing
const CHUNK_SIZE = 80000; // 80KB per chunk for safe processing
const MAX_PROCESSING_ATTEMPTS = 3;
const FALLBACK_CHUNK_SIZE = 50000; // Smaller chunks for retry

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
  expiresAt?: Date,
  additionalFields?: any
) {
  const updateData: any = {
    lesson_id: lessonId,
    session_id: sessionId,
    transcription_status: status,
    updated_at: new Date().toISOString(),
    ...additionalFields
  };

  if (transcriptionUrl) updateData.transcription_url = transcriptionUrl;
  if (transcriptionText) updateData.transcription_text = transcriptionText;
  if (expiresAt) updateData.expires_at = expiresAt.toISOString();

  // Use upsert with lesson_id as the unique constraint since we added it
  const { data, error } = await supabase
    .from('lesson_transcriptions')
    .upsert(updateData, { 
      onConflict: 'lesson_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  return { data, error };
}

function validateTranscriptSize(text: string, lessonTitle: string): { isValid: boolean; size: number; suggestion?: string } {
  const size = new TextEncoder().encode(text).length;
  console.log(`Transcript size for lesson "${lessonTitle}": ${size} bytes`);
  
  if (size > MAX_TRANSCRIPT_SIZE) {
    console.warn(`Large transcript detected for lesson "${lessonTitle}": ${size} bytes. Will use chunking strategy.`);
    return {
      isValid: false,
      size,
      suggestion: 'Transcript too large for single processing, will use chunking strategy'
    };
  }
  
  return { isValid: true, size };
}

function chunkTranscript(text: string, chunkSize: number = CHUNK_SIZE): string[] {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + sentence + '. ';
    
    if (new TextEncoder().encode(testChunk).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + '. ';
    } else {
      currentChunk = testChunk;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  console.log(`Split transcript into ${chunks.length} chunks`);
  return chunks;
}

async function processTranscriptChunks(
  chunks: string[], 
  lessonId: string, 
  transcriptionId: string, 
  lesson: any, 
  students: any[]
): Promise<any[]> {
  const allSummaries = [];
  const chunkProcessingStatus: any = {};
  
  try {
    // Update transcription record with chunk information
    await upsertTranscriptionRecord(
      lessonId,
      lesson.lesson_space_session_id || 'unknown',
      'processing',
      undefined,
      undefined,
      undefined,
      {
        chunk_count: chunks.length,
        chunk_processing_status: chunkProcessingStatus,
        processing_notes: `Processing ${chunks.length} chunks for large transcript`
      }
    );

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length} for lesson ${lessonId}`);
      
      chunkProcessingStatus[`chunk_${i + 1}`] = 'processing';
      await updateChunkStatus(lessonId, chunkProcessingStatus);
      
      try {
        // Process this chunk for each student
        for (const student of students) {
          const studentName = `${student.first_name} ${student.last_name}`;
          
          const chunkPrompt = `
Analyze the following lesson transcription segment (part ${i + 1} of ${chunks.length}) and provide analysis for student "${studentName}".

Lesson Details:
- Title: ${lesson.title}
- Subject: ${lesson.subject || 'Not specified'}
- Transcript Segment: ${i + 1}/${chunks.length}

Transcription Segment:
${chunk}

Focus on this specific segment and provide:
1. **Topics Covered in this segment**: List topics discussed in THIS segment only
2. **Student Contributions in this segment**: ${studentName}'s specific contributions in THIS segment
3. **Engagement in this segment**: ${studentName}'s engagement level in THIS segment
4. **Key Moments**: Notable interactions or responses from ${studentName} in THIS segment

Please provide a JSON response with the structure:
{
  "segment_number": ${i + 1},
  "topics_covered": ["topic1", "topic2"],
  "student_contributions": "description of contributions in this segment",
  "engagement_level": "Low|Medium|High",
  "key_moments": ["moment1", "moment2"],
  "confidence_indicators": {
    "confident_statements": ["example1"],
    "hesitation_patterns": ["example1"]
  }
}
`;

          const response = await callOpenAI(chunkPrompt, studentName, i + 1);
          if (response) {
            allSummaries.push({
              studentId: student.id,
              studentName,
              segmentNumber: i + 1,
              segmentData: response
            });
          }
        }
        
        chunkProcessingStatus[`chunk_${i + 1}`] = 'completed';
        console.log(`Completed processing chunk ${i + 1}/${chunks.length}`);
        
      } catch (chunkError) {
        console.error(`Error processing chunk ${i + 1}:`, chunkError);
        chunkProcessingStatus[`chunk_${i + 1}`] = 'error';
        chunkProcessingStatus[`chunk_${i + 1}_error`] = chunkError.message;
      }
      
      await updateChunkStatus(lessonId, chunkProcessingStatus);
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Combine all segments into final summaries for each student
    const finalSummaries = await combineChunkSummaries(allSummaries, students, lessonId, transcriptionId);
    
    // Mark processing as complete
    await upsertTranscriptionRecord(
      lessonId,
      lesson.lesson_space_session_id || 'unknown',
      'available',
      undefined,
      undefined,
      undefined,
      {
        chunk_processing_status: chunkProcessingStatus,
        processing_notes: `Successfully processed ${chunks.length} chunks`
      }
    );
    
    return finalSummaries;
    
  } catch (error) {
    console.error('Error in chunk processing:', error);
    await upsertTranscriptionRecord(
      lessonId,
      lesson.lesson_space_session_id || 'unknown',
      'error',
      undefined,
      undefined,
      undefined,
      {
        chunk_processing_status: chunkProcessingStatus,
        last_processing_error: error.message,
        processing_notes: `Failed during chunk processing: ${error.message}`
      }
    );
    throw error;
  }
}

async function updateChunkStatus(lessonId: string, chunkStatus: any) {
  await supabase
    .from('lesson_transcriptions')
    .update({ chunk_processing_status: chunkStatus })
    .eq('lesson_id', lessonId);
}

async function combineChunkSummaries(allSummaries: any[], students: any[], lessonId: string, transcriptionId: string): Promise<any[]> {
  const finalSummaries = [];
  
  for (const student of students) {
    const studentSummaries = allSummaries.filter(s => s.studentId === student.id);
    
    if (studentSummaries.length === 0) continue;
    
    // Combine all segment data for this student
    const combinedTopics = new Set<string>();
    const allContributions: string[] = [];
    const allKeyMoments: string[] = [];
    const allConfidentStatements: string[] = [];
    const allHesitationPatterns: string[] = [];
    
    let totalEngagement = 0;
    let engagementCount = 0;
    
    for (const summary of studentSummaries) {
      const data = summary.segmentData;
      
      // Combine topics
      if (data.topics_covered) {
        data.topics_covered.forEach((topic: string) => combinedTopics.add(topic));
      }
      
      // Combine contributions
      if (data.student_contributions) {
        allContributions.push(`Segment ${data.segment_number}: ${data.student_contributions}`);
      }
      
      // Combine key moments
      if (data.key_moments) {
        data.key_moments.forEach((moment: string) => 
          allKeyMoments.push(`Segment ${data.segment_number}: ${moment}`)
        );
      }
      
      // Track engagement
      if (data.engagement_level) {
        const engagementMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
        totalEngagement += engagementMap[data.engagement_level as keyof typeof engagementMap] || 0;
        engagementCount++;
      }
      
      // Combine confidence indicators
      if (data.confidence_indicators?.confident_statements) {
        allConfidentStatements.push(...data.confidence_indicators.confident_statements);
      }
      if (data.confidence_indicators?.hesitation_patterns) {
        allHesitationPatterns.push(...data.confidence_indicators.hesitation_patterns);
      }
    }
    
    // Calculate overall engagement
    const avgEngagement = engagementCount > 0 ? totalEngagement / engagementCount : 0;
    const overallEngagement = avgEngagement <= 1.5 ? 'Low' : avgEngagement <= 2.5 ? 'Medium' : 'High';
    
    // Create final summary
    const summaryData = {
      lesson_id: lessonId,
      student_id: student.id,
      transcription_id: transcriptionId,
      topics_covered: Array.from(combinedTopics),
      student_contributions: allContributions.join('\n\n'),
      what_went_well: allKeyMoments.filter(m => !m.toLowerCase().includes('struggle')).join('\n'),
      areas_for_improvement: allKeyMoments.filter(m => m.toLowerCase().includes('struggle')).join('\n') || 'No specific areas identified',
      engagement_level: overallEngagement,
      engagement_score: Math.round(avgEngagement * 3.33), // Convert to 0-10 scale
      confidence_score: allConfidentStatements.length > allHesitationPatterns.length ? 7 : 4,
      participation_time_percentage: Math.min(100, allContributions.length * 10),
      confidence_indicators: {
        confident_statements: allConfidentStatements.slice(0, 5),
        hesitation_patterns: allHesitationPatterns.slice(0, 5)
      },
      ai_summary: `Combined analysis from ${studentSummaries.length} transcript segments. Student showed ${overallEngagement.toLowerCase()} engagement with ${allContributions.length} notable contributions across the lesson.`,
    };
    
    // Save to database
    const { data: summary, error: summaryError } = await supabase
      .from('lesson_student_summaries')
      .upsert(summaryData, {
        onConflict: 'lesson_id,student_id,transcription_id',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (summaryError) {
      console.error(`Error saving combined summary for student ${student.id}:`, summaryError);
    } else {
      finalSummaries.push(summary);
    }
  }
  
  return finalSummaries;
}

async function callOpenAI(prompt: string, studentName: string, segmentNumber: number, useRetry: boolean = false): Promise<any> {
  const model = useRetry ? 'gpt-4o-mini' : 'o3-2025-04-16'; // Use smaller model for retries
  const maxTokens = useRetry ? 1000 : 2000;
  
  try {
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educational analyst. Analyze lesson transcription segments to provide detailed, constructive feedback. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_completion_tokens: maxTokens,
      }),
    });

    if (!openAIResponse.ok) {
      if (openAIResponse.status === 413 || openAIResponse.status === 400) {
        console.warn(`Request too large for ${studentName} segment ${segmentNumber}, retrying with smaller model`);
        if (!useRetry) {
          return await callOpenAI(prompt, studentName, segmentNumber, true);
        }
      }
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const aiResponse = await openAIResponse.json();
    const aiContent = aiResponse.choices[0]?.message?.content;

    if (!aiContent) {
      console.error(`No AI response for ${studentName} segment ${segmentNumber}`);
      return null;
    }

    // Parse JSON response
    let cleanContent = aiContent.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return JSON.parse(cleanContent);
    
  } catch (error) {
    console.error(`Error calling OpenAI for ${studentName} segment ${segmentNumber}:`, error);
    return null;
  }
}

async function generateStudentSummaries(lessonId: string, transcriptionId: string) {
  console.log(`Generating student summaries for lesson: ${lessonId}, transcription: ${transcriptionId}`);

  // Track processing attempts
  const { data: currentTranscription } = await supabase
    .from('lesson_transcriptions')
    .select('processing_attempts, last_processing_error')
    .eq('id', transcriptionId)
    .single();

  const attempts = (currentTranscription?.processing_attempts || 0) + 1;
  
  if (attempts > MAX_PROCESSING_ATTEMPTS) {
    await upsertTranscriptionRecord(lessonId, '', 'error', undefined, undefined, undefined, {
      processing_attempts: attempts,
      last_processing_error: 'Maximum processing attempts exceeded',
      processing_notes: 'Failed after maximum retry attempts'
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Maximum processing attempts exceeded. Transcript may be too large or complex.',
        attempts 
      }),
      { 
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Update attempt counter
  await supabase
    .from('lesson_transcriptions')
    .update({ processing_attempts: attempts })
    .eq('id', transcriptionId);

  // Get transcription details
  const { data: transcription, error: transcriptionError } = await supabase
    .from('lesson_transcriptions')
    .select('transcription_text, transcription_url, transcript_size_bytes')
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
        console.log('LessonSpace transcription JSON structure keys:', Object.keys(transcriptionData || {}));
        
        // Extract transcript text from the JSON structure
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
        
        // Calculate and save transcript size
        const transcriptSize = new TextEncoder().encode(transcriptionText).length;
        console.log(`Transcript size: ${transcriptSize} bytes`);
        
        // Save the text and size to our database
        await supabase
          .from('lesson_transcriptions')
          .update({ 
            transcription_text: transcriptionText,
            transcript_size_bytes: transcriptSize
          })
          .eq('id', transcriptionId);
        
      } else {
        console.error(`Failed to fetch transcription URL. Status: ${textResponse.status}`);
        if (textResponse.status === 404) {
          return new Response(
            JSON.stringify({ 
              error: 'Transcription too large (404 from LessonSpace)',
              suggestion: 'The transcript exceeded size limits and cannot be processed'
            }),
            { 
              status: 413,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
      }
    } catch (error) {
      console.error('Error fetching transcription text:', error);
      await upsertTranscriptionRecord(lessonId, '', 'error', undefined, undefined, undefined, {
        last_processing_error: `Failed to fetch transcript: ${error.message}`,
        processing_notes: 'Error occurred while fetching transcript from URL'
      });
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
  
  // Validate transcript size and determine processing strategy
  const validation = validateTranscriptSize(transcriptionText, lesson.title);
  
  try {
    let summaries = [];
    
    if (validation.isValid) {
      // Standard processing for smaller transcripts
      console.log(`Using standard processing for lesson "${lesson.title}"`);
      summaries = await processStandardTranscript(transcriptionText, lessonId, transcriptionId, lesson, students);
    } else {
      // Chunked processing for large transcripts
      console.log(`Using chunked processing for lesson "${lesson.title}" (${validation.size} bytes)`);
      const chunkSize = attempts > 1 ? FALLBACK_CHUNK_SIZE : CHUNK_SIZE;
      const chunks = chunkTranscript(transcriptionText, chunkSize);
      summaries = await processTranscriptChunks(chunks, lessonId, transcriptionId, lesson, students);
    }

    console.log(`Generated ${summaries.length} summaries for lesson ${lessonId}`);

    return new Response(
      JSON.stringify({
        success: true,
        summaries,
        processing_info: {
          strategy: validation.isValid ? 'standard' : 'chunked',
          transcript_size: validation.size,
          attempts
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error(`Error generating summaries for lesson ${lessonId}:`, error);
    
    await upsertTranscriptionRecord(lessonId, '', 'error', undefined, undefined, undefined, {
      processing_attempts: attempts,
      last_processing_error: error.message,
      processing_notes: `Processing failed on attempt ${attempts}: ${error.message}`
    });

    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate student summaries',
        details: error.message,
        attempts
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function processStandardTranscript(
  transcriptionText: string, 
  lessonId: string, 
  transcriptionId: string, 
  lesson: any, 
  students: any[]
): Promise<any[]> {
  const summaries = [];

  // Generate AI summary for each student using the original logic
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
6. **Engagement Score**: Rate ${studentName}'s engagement on a scale of 0-10 based on participation frequency, question asking, response quality
7. **Confidence Score**: Rate ${studentName}'s confidence level on a scale of 0-10 based on certainty in responses, willingness to participate, tone of voice
8. **Speaking Metrics**: Estimate ${studentName}'s participation time percentage (0-100%) and count of questions asked and responses given
9. **Confidence Indicators**: Identify specific signs of confidence or hesitation (e.g., "I think...", "I'm not sure...", confident statements, clear explanations)
10. **Overall Summary**: Provide a comprehensive overview of ${studentName}'s performance and learning in this lesson

Please be specific and provide examples from the transcription. If ${studentName} is not mentioned in the transcription, note their absence or lack of participation.

Format your response as a JSON object with the following structure:
{
  "topics_covered": ["topic1", "topic2", "topic3"],
  "student_contributions": "detailed description",
  "what_went_well": "positive aspects",
  "areas_for_improvement": "areas needing attention",
  "engagement_level": "Low|Medium|High",
  "engagement_score": 7,
  "confidence_score": 6,
  "participation_time_percentage": 15.5,
  "questions_asked": 3,
  "responses_given": 8,
  "confidence_indicators": {
    "confident_statements": ["example1", "example2"],
    "hesitation_patterns": ["example1", "example2"],
    "improvement_signs": ["example1", "example2"]
  },
  "overall_summary": "comprehensive summary"
}
`;

      const analysisData = await callOpenAI(prompt, studentName, 1);
      
      if (!analysisData) {
        console.error(`Failed to get analysis for student ${studentName}`);
        continue;
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
        engagement_score: analysisData.engagement_score || null,
        confidence_score: analysisData.confidence_score || null,
        participation_time_percentage: analysisData.participation_time_percentage || null,
        confidence_indicators: analysisData.confidence_indicators || {},
        ai_summary: analysisData.overall_summary || 'Analysis completed',
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
        summaries.push(summary);
      }

    } catch (error) {
      console.error(`Error processing student ${student.id}:`, error);
    }
  }

  return summaries;
}

async function pollPendingTranscriptions() {
  console.log('Polling for pending transcriptions...');
  
  const { data: pendingTranscriptions, error } = await supabase
    .from('lesson_transcriptions')
    .select(`
      id,
      lesson_id,
      session_id,
      transcription_status,
      created_at,
      lessons!inner(title)
    `)
    .eq('transcription_status', 'processing')
    .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // 5 minutes old
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
      console.log(`Checking transcription ${transcription.id} for lesson ${transcription.lesson_id}`);
      
      // Try to get the transcription again
      const result = await getTranscription(transcription.lesson_id);
      const resultData = await result.json();
      
      results.push({
        transcription_id: transcription.id,
        lesson_id: transcription.lesson_id,
        lesson_title: transcription.lessons?.title,
        status: resultData.success ? 'updated' : 'still_processing',
        error: resultData.error || null
      });
      
    } catch (error) {
      console.error(`Error polling transcription ${transcription.id}:`, error);
      results.push({
        transcription_id: transcription.id,
        lesson_id: transcription.lesson_id,
        status: 'error',
        error: error.message
      });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return new Response(
    JSON.stringify({
      success: true,
      polled_count: pendingTranscriptions?.length || 0,
      results
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}