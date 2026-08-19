import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) return json({ error: 'OPENAI_API_KEY is not configured' }, 500);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !userData?.user) return json({ error: 'Not authenticated' }, 401);
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const lessonId: string | undefined = body?.lessonId;
    const studentId: number | undefined = Number(body?.studentId);
    const force: boolean = !!body?.force;

    if (!lessonId || !studentId || Number.isNaN(studentId)) {
      return json({ error: 'lessonId and studentId are required' }, 400);
    }

    // ---- Access check -------------------------------------------------
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    const roleList = (roles || []).map((r: any) => r.role);
    const isStaff = roleList.includes('admin') || roleList.includes('owner');

    const { data: lesson, error: lessonError } = await admin
      .from('lessons')
      .select('id, title, subject, start_time, tutor_id')
      .eq('id', lessonId)
      .maybeSingle();
    if (lessonError || !lesson) return json({ error: 'Lesson not found' }, 404);

    let allowed = isStaff;

    const userEmail = userData.user.email;

    if (!allowed && roleList.includes('tutor') && userEmail) {
      const { data: tutor } = await admin
        .from('tutors')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      if (tutor?.id && tutor.id === lesson.tutor_id) allowed = true;
    }

    if (!allowed) {
      const { data: student } = await admin
        .from('students')
        .select('id, parent_id, email, user_id')
        .eq('id', studentId)
        .maybeSingle();
      if (student) {
        if (student.user_id === userId) allowed = true;
        if (!allowed && userEmail && student.email && student.email.toLowerCase() === userEmail.toLowerCase()) {
          allowed = true;
        }
        if (!allowed && student.parent_id) {
          const { data: parent } = await admin
            .from('parents')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          if (parent?.id && parent.id === student.parent_id) allowed = true;
        }
      }
    }

    if (!allowed) return json({ error: 'You do not have access to this lesson' }, 403);

    // ---- Existing deck ------------------------------------------------
    const { data: existing } = await admin
      .from('lesson_revision_notes')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existing && !force) {
      return json({ cards: existing.cards, generated_at: existing.generated_at, cached: true });
    }

    // ---- Source material ----------------------------------------------
    const { data: transcript } = await admin
      .from('lesson_transcriptions')
      .select('transcription_text, transcription_status')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    const transcriptText = (transcript?.transcription_text || '').trim();
    if (!transcriptText) {
      return json({
        error: 'no_transcript',
        message: 'Revision notes become available once this lesson transcript has finished processing.',
      }, 409);
    }

    const { data: summary } = await admin
      .from('lesson_student_summaries')
      .select('areas_for_improvement, what_went_well, topics_covered, attendance_status')
      .eq('lesson_id', lessonId)
      .eq('student_id', studentId)
      .maybeSingle();

    const { data: student } = await admin
      .from('students')
      .select('first_name, last_name, year_group')
      .eq('id', studentId)
      .maybeSingle();

    const attended = (summary?.attendance_status || '').toLowerCase() !== 'missed'
      && (summary?.attendance_status || '').toLowerCase() !== 'absent';

    const weaknesses = summary?.areas_for_improvement?.trim();
    const topics = Array.isArray(summary?.topics_covered) ? summary!.topics_covered.join(', ') : '';

    const focusBlock = attended && weaknesses
      ? `The student's areas for improvement in this lesson were:\n${weaknesses}\n\nEvery flashcard must drill one of these weaknesses.`
      : `The student did not attend this lesson (or no personal weaknesses were recorded). Build the flashcards to cover the core content of the lesson so they can catch up.`;

    const prompt = `You are creating revision flashcards from the transcript of a real tutoring lesson.

Lesson: ${lesson.title} (${lesson.subject})
Student: ${student?.first_name ?? 'Student'} ${student?.last_name ?? ''}${student?.year_group ? ` — ${student.year_group}` : ''}
Topics covered: ${topics || 'see transcript'}

${focusBlock}

Rules:
- Produce 8 to 12 flashcards.
- Use only content that actually appears in the transcript: the same definitions, worked examples, numbers and wording the tutor used.
- Fronts are short recall/apply questions. Backs are complete but concise answers (1-4 sentences, or the worked steps).
- Never reference "the transcript", "the lesson recording" or the tutor by name in the card text.
- Tag each card with the weakness/topic area it targets and a difficulty of easy, medium or hard. Include a spread of difficulties.

TRANSCRIPT:
${transcriptText.slice(0, 60000)}`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        messages: [
          { role: 'system', content: 'You are an expert UK tutor who writes precise, exam-focused revision flashcards. Always respond with valid JSON matching the requested schema.' },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'revision_flashcards',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                cards: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      front: { type: 'string' },
                      back: { type: 'string' },
                      focus_area: { type: 'string' },
                      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                    },
                    required: ['front', 'back', 'focus_area', 'difficulty'],
                  },
                },
              },
              required: ['cards'],
            },
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      const details = await aiResponse.text();
      console.error(`OpenAI request failed [${aiResponse.status}]: ${details}`);
      return json({ error: 'AI generation failed', status: aiResponse.status, details }, aiResponse.status);
    }

    const aiData = await aiResponse.json();
    const content = aiData?.choices?.[0]?.message?.content;
    let cards: any[] = [];
    try {
      cards = JSON.parse(content || '{}')?.cards ?? [];
    } catch (e) {
      console.error('Failed to parse AI response', content);
      return json({ error: 'Could not parse the generated flashcards' }, 502);
    }

    if (!cards.length) {
      return json({ error: 'The model returned no flashcards. Please try again.' }, 502);
    }

    const { data: saved, error: saveError } = await admin
      .from('lesson_revision_notes')
      .upsert({
        lesson_id: lessonId,
        student_id: studentId,
        cards,
        source: 'transcript',
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'lesson_id,student_id' })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save revision notes', saveError);
      return json({ error: saveError.message }, 500);
    }

    return json({ cards: saved.cards, generated_at: saved.generated_at, cached: false });
  } catch (error) {
    console.error('generate-revision-notes error:', error);
    return json({ error: (error as Error).message || 'Internal server error' }, 500);
  }
});
