import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarkingRequest {
  questionText: string;
  studentAnswer: string;
  questionType: 'multiple_choice' | 'short_answer' | 'extended_writing' | 'calculation';
  marks: number;
  keywords?: string[];
  subject: string;
  examBoard?: string;
  correctAnswer?: string;
  markScheme?: string;
}

interface MarkingResult {
  marksAwarded: number;
  maxMarks: number;
  isCorrect: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: MarkingRequest = await req.json();
    const { questionText, studentAnswer, questionType, marks, keywords, subject, examBoard, correctAnswer, markScheme } = body;

    console.log('📝 AI Marking Request:', { 
      questionType, 
      marks, 
      subject, 
      answerLength: studentAnswer?.length,
      hasKeywords: !!keywords?.length 
    });

    // Build marking prompt based on subject and question type
    const systemPrompt = buildSystemPrompt(subject, questionType, marks);
    const userPrompt = buildUserPrompt(questionText, studentAnswer, marks, keywords, correctAnswer, markScheme, examBoard);

    // Call Lovable AI with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_marking",
              description: "Submit the marking result for the student's answer",
              parameters: {
                type: "object",
                properties: {
                  marksAwarded: { 
                    type: "number", 
                    description: "Number of marks to award (0 to maxMarks)" 
                  },
                  feedback: { 
                    type: "string", 
                    description: "Brief feedback for the student (1-2 sentences)" 
                  },
                  strengths: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "List of 1-3 things the student did well"
                  },
                  improvements: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "List of 1-3 things the student could improve"
                  }
                },
                required: ["marksAwarded", "feedback", "strengths", "improvements"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "submit_marking" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      // Return fallback marking for errors
      return new Response(JSON.stringify(createFallbackMarking(marks, studentAnswer)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('📝 AI Response:', JSON.stringify(data).substring(0, 500));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'submit_marking') {
      console.error('No valid tool call in response');
      return new Response(JSON.stringify(createFallbackMarking(marks, studentAnswer)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const markingData = JSON.parse(toolCall.function.arguments);
    
    // Validate and clamp marks
    const marksAwarded = Math.max(0, Math.min(marks, Math.round(markingData.marksAwarded)));
    
    const result: MarkingResult = {
      marksAwarded,
      maxMarks: marks,
      isCorrect: marksAwarded >= Math.ceil(marks * 0.5), // 50%+ = correct
      feedback: markingData.feedback || 'Good effort!',
      strengths: markingData.strengths || [],
      improvements: markingData.improvements || []
    };

    console.log('✅ AI Marking Result:', { 
      marksAwarded: result.marksAwarded, 
      maxMarks: result.maxMarks,
      isCorrect: result.isCorrect 
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Marking error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      // Return a safe fallback
      marksAwarded: 0,
      maxMarks: 1,
      isCorrect: false,
      feedback: 'Unable to mark this answer automatically. Cleo will review it.',
      strengths: [],
      improvements: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSystemPrompt(subject: string, questionType: string, marks: number): string {
  const isEnglish = subject.toLowerCase().includes('english');
  const isScience = ['biology', 'chemistry', 'physics', 'science'].some(s => subject.toLowerCase().includes(s));
  const isMaths = subject.toLowerCase().includes('math');

  let subjectGuidance = '';
  
  if (isEnglish) {
    subjectGuidance = `
For English answers:
- Focus on quality of analysis, not keyword matching
- Look for evidence of understanding the text
- Value interpretation and personal response
- Check for relevant quotes or textual references
- Assess clarity of expression and structure`;
  } else if (isScience) {
    subjectGuidance = `
For Science answers:
- Check for correct scientific terminology
- Look for clear cause-and-effect explanations
- Value accuracy of facts and processes
- Check mathematical calculations if present
- Assess understanding of scientific concepts`;
  } else if (isMaths) {
    subjectGuidance = `
For Maths answers:
- Check the final answer is correct
- Award method marks for correct working even if final answer is wrong
- Look for clear logical steps
- Value correct mathematical notation
- Partial marks for partially correct approaches`;
  }

  // Sanity check for question marks vs type
  let marksSanityNote = '';
  if (questionType === 'multiple_choice' && marks > 4) {
    marksSanityNote = `\n⚠️ NOTE: This multiple choice question is marked as ${marks} marks which seems high. Multiple choice typically = 1-2 marks. Mark fairly but note this in feedback if the question seems over-valued.`;
  } else if (questionType === 'short_answer' && marks > 6) {
    marksSanityNote = `\n⚠️ NOTE: This short answer question is marked as ${marks} marks which seems high. Short answers typically = 2-4 marks. Mark fairly but note this in feedback if the question seems over-valued.`;
  } else if (questionType === 'extended_writing' && marks < 4) {
    marksSanityNote = `\n⚠️ NOTE: This extended writing question is marked as only ${marks} marks which seems low. Extended writing typically = 6-12 marks. Mark the student fairly based on the actual marks available.`;
  }

  return `You are an expert GCSE examiner marking a ${questionType} question worth ${marks} marks.
${subjectGuidance}
${marksSanityNote}

STRICT MARKING RULES:
- Be fair but accurate - award marks the student genuinely deserves
- A blank or irrelevant answer = 0 marks
- Partial credit is allowed for partially correct answers
- For ${marks}-mark questions, each mark requires a specific point/skill demonstrated
- NEVER award full marks unless the answer fully addresses all required points
- Keep feedback encouraging but honest
- Focus on 1-3 specific strengths and improvements

MARK ALLOCATION GUIDANCE (GCSE Standard):
- 1 mark = One correct fact/point
- 2 marks = Two correct facts OR one explained point
- 3-4 marks = Explanation with supporting detail
- 5-6 marks = Detailed explanation with multiple points
- 6+ marks = Extended response with analysis and evidence

You MUST use the submit_marking tool to return your assessment.`;
}

function buildUserPrompt(
  questionText: string, 
  studentAnswer: string, 
  marks: number, 
  keywords?: string[],
  correctAnswer?: string,
  markScheme?: string,
  examBoard?: string
): string {
  let prompt = `QUESTION (${marks} marks):\n${questionText}\n\n`;
  prompt += `STUDENT'S ANSWER:\n${studentAnswer}\n\n`;
  
  if (correctAnswer) {
    prompt += `MODEL ANSWER:\n${correctAnswer}\n\n`;
  }
  
  if (markScheme) {
    prompt += `MARK SCHEME:\n${markScheme}\n\n`;
  }
  
  if (keywords && keywords.length > 0) {
    prompt += `KEY POINTS TO LOOK FOR:\n${keywords.join(', ')}\n\n`;
  }
  
  if (examBoard) {
    prompt += `EXAM BOARD: ${examBoard}\n\n`;
  }

  prompt += `Please mark this answer out of ${marks}. Award marks fairly based on the quality and accuracy of the response.`;
  
  return prompt;
}

function createFallbackMarking(marks: number, studentAnswer: string): MarkingResult {
  // Simple fallback when AI fails - give benefit of doubt
  const hasContent = studentAnswer && studentAnswer.trim().length > 10;
  const marksAwarded = hasContent ? Math.ceil(marks * 0.5) : 0;
  
  return {
    marksAwarded,
    maxMarks: marks,
    isCorrect: hasContent,
    feedback: hasContent 
      ? "Good effort! Cleo will give you more detailed feedback." 
      : "Remember to provide a complete answer.",
    strengths: hasContent ? ["You attempted the question"] : [],
    improvements: hasContent ? [] : ["Provide a more complete answer"]
  };
}
