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
    const { specificationId } = await req.json();

    if (!specificationId) {
      return new Response(
        JSON.stringify({ error: 'Missing specificationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get specification details
    const { data: spec, error: specError } = await supabase
      .from('exam_board_specifications')
      .select('*')
      .eq('id', specificationId)
      .single();

    if (specError || !spec) throw new Error('Specification not found');

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('exam-board-specifications')
      .download(spec.file_name);

    if (downloadError) throw downloadError;

    // Convert to base64 for AI processing (process in chunks to avoid stack overflow)
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    let binary = '';
    const chunkSize = 8192; // Process 8KB at a time
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);

    // Create data URI for the PDF
    const dataUri = `data:${spec.mime_type};base64,${base64}`;

    console.log(`Processing PDF: ${spec.title} (${spec.exam_board}) - Size: ${bytes.length} bytes`);

    // Use AI to extract and summarize text from the actual PDF
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert in UK exam specifications. Carefully read and analyze the provided specification document.

Extract the following information:
1. A comprehensive summary (200-300 words) covering:
   - Main topics and content areas
   - Assessment objectives (AO1, AO2, etc.)
   - Key skills and knowledge required
   - Assessment format and structure
   - Any unique features or requirements

2. A list of 8-12 key topics/themes covered in the specification

3. Important command words used (e.g., "explain", "evaluate", "analyse")

4. Assessment objectives with their descriptions

5. Any important notes about exam structure, marks, or time allocations

Format your response ONLY as valid JSON (no markdown, no code blocks):
{
  "summary": "...",
  "key_topics": ["topic1", "topic2", ...],
  "command_words": ["explain", "evaluate", ...],
  "assessment_objectives": ["AO1: ...", "AO2: ..."],
  "notes": "..."
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Please analyze this ${spec.exam_board} ${spec.title} specification document. Extract all the key information as specified.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUri
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI processing failed:', aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    console.log('AI response received, parsing JSON...');

    // Parse AI response - expect pure JSON
    let extractedData;
    try {
      // First try to parse as direct JSON
      extractedData = JSON.parse(aiContent);
    } catch (firstError) {
      // If that fails, try to extract JSON from markdown code blocks or other wrapping
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          console.error('No JSON found in response:', aiContent.slice(0, 200));
          extractedData = {
            summary: aiContent.slice(0, 500),
            key_topics: [],
            command_words: [],
            assessment_objectives: [],
            notes: 'Failed to parse structured data from AI response'
          };
        }
      } catch (secondError) {
        console.error('Failed to parse AI response:', secondError);
        extractedData = {
          summary: aiContent.slice(0, 500),
          key_topics: [],
          command_words: [],
          assessment_objectives: [],
          notes: 'Failed to parse structured data from AI response'
        };
      }
    }

    console.log('Extracted data:', {
      summaryLength: extractedData.summary?.length,
      topicsCount: extractedData.key_topics?.length,
      commandWordsCount: extractedData.command_words?.length,
      aoCount: extractedData.assessment_objectives?.length
    });

    // Update specification with extracted data
    const { error: updateError } = await supabase
      .from('exam_board_specifications')
      .update({
        extracted_text: aiContent,
        summary: extractedData.summary || null,
        key_topics: extractedData.key_topics || [],
        status: 'active',
      })
      .eq('id', specificationId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: extractedData.summary,
        key_topics: extractedData.key_topics,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-specification-text:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
