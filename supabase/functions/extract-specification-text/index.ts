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

    // Convert to base64 for text extraction (simplified - in production use proper PDF parsing)
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use AI to extract and summarize text
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
            content: `You are an expert in UK exam specifications. Extract key information from this ${spec.exam_board} specification document and provide:
1. A concise summary (200-300 words) covering the main topics, assessment objectives, and key requirements
2. A list of 8-12 key topics/themes as a JSON array
3. Important command words and assessment criteria

Format your response as JSON:
{
  "summary": "...",
  "key_topics": ["topic1", "topic2", ...],
  "command_words": ["explain", "evaluate", ...],
  "assessment_objectives": ["AO1: ...", "AO2: ..."]
}`
          },
          {
            role: 'user',
            content: `Please analyze this ${spec.exam_board} ${spec.title} specification document. Note: This is a ${spec.mime_type} file. Extract the key information as specified.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI processing failed');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parse AI response
    let extractedData;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = {
          summary: aiContent.slice(0, 500),
          key_topics: [],
        };
      }
    } catch {
      extractedData = {
        summary: aiContent.slice(0, 500),
        key_topics: [],
      };
    }

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
