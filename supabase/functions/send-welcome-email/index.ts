import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface LessonTime {
  day?: string;
  time?: string;
  duration?: number;
}

interface Payload {
  parentEmail: string;
  parentName?: string | null;
  childName?: string | null;
  lessonTimes?: LessonTime[] | null;
  startDateTime?: string | null;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

function formatStart(payload: Payload): string {
  if (payload.startDateTime) return payload.startDateTime;
  const lt = payload.lessonTimes?.[0];
  if (lt?.day && lt?.time) return `${lt.day} at ${lt.time}`;
  if (lt?.day) return lt.day;
  return 'your first scheduled lesson time';
}

function firstName(name?: string | null): string {
  if (!name) return 'there';
  return name.trim().split(/\s+/)[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
      throw new Error('Email service not configured');
    }
    const payload = (await req.json()) as Payload;
    if (!payload.parentEmail) {
      return new Response(JSON.stringify({ error: 'parentEmail is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parentFirst = firstName(payload.parentName);
    const childName = (payload.childName || '').trim() || 'your child';
    const startStr = formatStart(payload);

    const html = `
<div style="font-family: Arial, Helvetica, sans-serif; color:#111; font-size:15px; line-height:1.6;">
  <p>Hello ${parentFirst},</p>

  <p>I hope this message finds you well. My name is Hannah and I'll be your dedicated point of contact here at Class Beyond Academy (formerly JB Tutors) to support you and ${childName}. I'd love to arrange a quick call to properly introduce myself — when would be a convenient time for you?</p>

  <p>In the meantime, we've set up your account. Lessons commence on <strong>${startStr}</strong>.</p>

  <p><strong>Get started in 3 easy steps:</strong></p>
  <ol>
    <li>Visit: <a href="https://classclowncrm.com/auth">https://classclowncrm.com/auth</a></li>
    <li>Log in with your credentials:<br/>
      Email: ${payload.parentEmail}<br/>
      Password: classbeyond123!
    </li>
    <li>You're in — head to your calendar to join lessons.</li>
  </ol>

  <p><strong>To join a lesson:</strong></p>
  <ol>
    <li>Once logged in, you'll land on your calendar.</li>
    <li>Click your scheduled lesson.</li>
    <li>Select "Join Lesson."</li>
  </ol>

  <p><strong>Camera &amp; microphone policy:</strong><br/>
  Before entering, you'll be prompted to review our Camera and Microphone Policy. Please read this carefully, then click "I Accept and Join My Lesson" to proceed.</p>

  <p>If you have any issues logging in or joining, simply reply to this email — we're always here to help.</p>

  <p>${childName}'s tutors are really looking forward to seeing them in class.</p>

  <p>Kind regards,<br/>Hannah<br/>Class Beyond Academy</p>
</div>`;

    const text = `Hello ${parentFirst},

I hope this message finds you well. My name is Hannah and I'll be your dedicated point of contact here at Class Beyond Academy (formerly JB Tutors) to support you and ${childName}. I'd love to arrange a quick call to properly introduce myself — when would be a convenient time for you?

In the meantime, we've set up your account. Lessons commence on ${startStr}.

Get started in 3 easy steps:
1. Visit: https://classclowncrm.com/auth
2. Log in with your credentials:
   Email: ${payload.parentEmail}
   Password: classbeyond123!
3. You're in — head to your calendar to join lessons.

To join a lesson:
1. Once logged in, you'll land on your calendar.
2. Click your scheduled lesson.
3. Select "Join Lesson."

Camera & microphone policy:
Before entering, you'll be prompted to review our Camera and Microphone Policy. Please read this carefully, then click "I Accept and Join My Lesson" to proceed.

If you have any issues logging in or joining, simply reply to this email — we're always here to help.

${childName}'s tutors are really looking forward to seeing them in class.

Kind regards,
Hannah
Class Beyond Academy`;

    const resp = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Hannah <hannah@classbeyondacademy.io>',
        to: [payload.parentEmail],
        reply_to: 'hannah@classbeyondacademy.io',
        subject: 'Welcome to Class Beyond Academy',
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error(`Resend error [${resp.status}]:`, body);
      return new Response(
        JSON.stringify({ error: 'Failed to send welcome email', status: resp.status, details: body }),
        { status: resp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await resp.json();
    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('send-welcome-email error:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
