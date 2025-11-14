import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExamQuestion {
  question_number: number;
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation';
  marks: number;
  marking_scheme: string;
  correct_answer: string;
  keywords: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId } = await req.json();

    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch conversation and messages
    const { data: conversation, error: convError } = await supabase
      .from('cleo_conversations')
      .select(`
        *,
        cleo_messages(*)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    const lessonTopic = conversation.topic || 'General Learning';
    const messages = conversation.cleo_messages || [];
    
    // Extract key content from conversation
    const conversationContext = messages
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n')
      .substring(0, 3000); // Limit context size

    console.log(`Generating GCSE exam for topic: ${lessonTopic}`);

    // Call Lovable AI to generate exam questions
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
            content: `You are a GCSE exam paper creator. Generate realistic GCSE-style exam questions based on the lesson content provided.

Include:
- 6-10 questions of varying difficulty levels
- Mix of question types: multiple choice, short answer, extended writing, calculations
- Appropriate marks allocation (1-6 marks per question)
- Use GCSE command words (describe, explain, calculate, evaluate, compare, discuss)
- Realistic GCSE formatting and style
- Detailed marking scheme for each question
- Expected keywords in answers

The questions should test understanding at GCSE level (ages 14-16, UK curriculum).`
          },
          {
            role: 'user',
            content: `Create a GCSE practice exam for the topic: "${lessonTopic}"

Context from the lesson:
${conversationContext}

Generate 8 realistic GCSE exam questions covering the key concepts from this lesson.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_exam_questions',
            description: 'Generate GCSE exam questions with marking schemes',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question_number: { type: 'number' },
                      question_text: { type: 'string' },
                      question_type: { 
                        type: 'string', 
                        enum: ['multiple_choice', 'short_answer', 'extended_writing', 'calculation'] 
                      },
                      marks: { type: 'number' },
                      marking_scheme: { type: 'string' },
                      correct_answer: { type: 'string' },
                      keywords: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['question_number', 'question_text', 'question_type', 'marks', 'marking_scheme', 'correct_answer']
                  }
                }
              },
              required: ['questions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_exam_questions' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate exam questions');
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract questions from tool call
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No questions generated');
    }

    const questionsData = JSON.parse(toolCall.function.arguments);
    const questions: ExamQuestion[] = questionsData.questions;

    if (!questions || questions.length === 0) {
      throw new Error('No questions generated');
    }

    console.log(`Generated ${questions.length} questions`);

    // Calculate total marks
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    // Generate PDF using jsPDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('GCSE Practice Examination', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(lessonTopic, 105, 30, { align: 'center' });
    
    // Instructions box
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(15, 40, 180, 20);
    
    doc.setFontSize(10);
    doc.text('Instructions:', 20, 47);
    doc.text('• Answer ALL questions', 20, 52);
    doc.text('• Write your answers in the spaces provided', 20, 57);
    doc.text(`• Total marks available: ${totalMarks}`, 140, 52);
    
    // Questions section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Questions', 20, 72);
    
    let yPosition = 82;
    
    questions.forEach((q, idx) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Question number and text
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const questionHeader = `${q.question_number}.`;
      doc.text(questionHeader, 20, yPosition);
      
      // Marks in brackets
      doc.setFont('helvetica', 'normal');
      doc.text(`[${q.marks} mark${q.marks > 1 ? 's' : ''}]`, 185, yPosition, { align: 'right' });
      
      // Question text (wrap if needed)
      yPosition += 6;
      doc.setFontSize(10);
      const questionLines = doc.splitTextToSize(q.question_text, 170);
      doc.text(questionLines, 25, yPosition);
      yPosition += questionLines.length * 5 + 5;
      
      // Answer space
      doc.setDrawColor(200);
      doc.setLineWidth(0.3);
      const answerLines = Math.max(3, Math.ceil(q.marks * 1.5));
      for (let i = 0; i < answerLines; i++) {
        doc.line(25, yPosition, 190, yPosition);
        yPosition += 6;
      }
      
      yPosition += 8;
    });
    
    // Add "End of Questions" marker
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('END OF QUESTIONS', 105, yPosition, { align: 'center' });
    
    // New page for answer key
    doc.addPage();
    
    // Answer key header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ANSWER KEY & MARKING SCHEME', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('For teacher/student reference', 105, 28, { align: 'center' });
    
    yPosition = 40;
    
    questions.forEach((q) => {
      // Check if we need a new page
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Question number
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Question ${q.question_number} (${q.marks} marks)`, 20, yPosition);
      yPosition += 8;
      
      // Answer
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Answer:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      const answerLines = doc.splitTextToSize(q.correct_answer, 160);
      doc.text(answerLines, 45, yPosition);
      yPosition += answerLines.length * 5 + 5;
      
      // Marking scheme
      doc.setFont('helvetica', 'bold');
      doc.text('Marking Scheme:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      const markingLines = doc.splitTextToSize(q.marking_scheme, 170);
      doc.text(markingLines, 20, yPosition);
      yPosition += markingLines.length * 5 + 3;
      
      // Keywords (if available)
      if (q.keywords && q.keywords.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(`Key terms: ${q.keywords.join(', ')}`, 20, yPosition);
        yPosition += 5;
      }
      
      // Separator line
      doc.setDrawColor(200);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
    });
    
    // Generate PDF as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];

    console.log('PDF generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        pdfData: pdfBase64,
        questionsGenerated: questions.length,
        totalMarks,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-lesson-exam:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
