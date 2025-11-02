import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { csvRows, commonFields, userId } = await req.json();
    
    console.log(`Starting bulk assessment creation for user ${userId} with ${csvRows.length} rows`);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Create all assessment records in bulk
    const assessmentsToInsert = csvRows.map((row: any) => ({
      title: commonFields.subject ? `${commonFields.subject} - ${row.topic}` : row.topic,
      description: row.description || '',
      subject: commonFields.subject,
      exam_board: commonFields.exam_board,
      year: commonFields.year,
      paper_type: commonFields.paper_type,
      time_limit_minutes: commonFields.time_limit_minutes,
      total_marks: commonFields.total_marks,
      questions_text: row.prompt,
      processing_status: 'pending',
      is_ai_generated: true,
      created_by: userId,
      status: 'draft',
      ai_extraction_data: {
        numberOfQuestions: commonFields.numberOfQuestions,
        topic: row.topic,
        prompt: row.prompt
      },
    }));

    const { data: createdAssessments, error: insertError } = await supabase
      .from('ai_assessments')
      .insert(assessmentsToInsert)
      .select('id');

    if (insertError) {
      console.error('Error inserting assessments:', insertError);
      throw insertError;
    }

    console.log(`Created ${createdAssessments.length} assessment records`);

    // 2. Return immediately to frontend
    const assessmentIds = createdAssessments.map((a: any) => a.id);
    
    // 3. Process assessments in background (non-blocking)
    const backgroundPromise = processAssessmentsInBackground(
      supabase,
      createdAssessments,
      commonFields,
      csvRows
    );
    
    // Use waitUntil to ensure background processing continues
    // @ts-ignore - EdgeRuntime is available in Supabase edge functions
    if (typeof EdgeRuntime !== 'undefined') {
      // @ts-ignore
      EdgeRuntime.waitUntil(backgroundPromise);
    } else {
      // Fallback for local development
      backgroundPromise.catch(err => console.error('Background processing error:', err));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        created: assessmentIds.length,
        assessmentIds 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in bulk-process-assessments:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processAssessmentsInBackground(
  supabase: any,
  assessments: any[],
  commonFields: any,
  csvRows: any[]
) {
  console.log(`Starting background processing of ${assessments.length} assessments`);
  
  for (let i = 0; i < assessments.length; i++) {
    const assessment = assessments[i];
    const row = csvRows[i];
    
    try {
      console.log(`Processing assessment ${i + 1}/${assessments.length}: ${row.topic}`);
      
      // Invoke ai-process-assessment for this assessment
      const { data, error } = await supabase.functions.invoke('ai-process-assessment', {
        body: {
          assessmentId: assessment.id,
          numberOfQuestions: commonFields.numberOfQuestions,
          topic: row.topic,
          prompt: row.prompt
        }
      });

      if (error) {
        console.error(`Failed to process assessment ${assessment.id}:`, error);
        
        // Update assessment with error status
        await supabase
          .from('ai_assessments')
          .update({ 
            processing_status: 'failed',
            processing_error: error.message || 'Unknown error'
          })
          .eq('id', assessment.id);
      } else {
        console.log(`Successfully processed assessment ${assessment.id}`);
      }
    } catch (error: any) {
      console.error(`Error processing assessment ${assessment.id}:`, error);
      
      // Update assessment with error status
      try {
        await supabase
          .from('ai_assessments')
          .update({ 
            processing_status: 'failed',
            processing_error: error.message || 'Unknown error'
          })
          .eq('id', assessment.id);
      } catch (updateError) {
        console.error(`Failed to update error status for assessment ${assessment.id}:`, updateError);
      }
    }
  }
  
  console.log(`Completed background processing of ${assessments.length} assessments`);
}
