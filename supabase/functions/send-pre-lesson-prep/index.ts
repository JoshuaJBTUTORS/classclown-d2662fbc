import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LessonData {
  id: string;
  title: string;
  subject: string;
  start_time: string;
  student_first_name: string;
}

const VALID_CLEO_SUBJECTS = [
  'biology', 'chemistry', 'physics', 'combined science',
  'maths', 'mathematics', 'english'
];

function getAcademicWeekInfo() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const academicYearStart = now.getMonth() < 8 
    ? new Date(currentYear - 1, 8, 1)
    : new Date(currentYear, 8, 1);
  
  const weeksSinceStart = Math.floor(
    (now.getTime() - academicYearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  
  const currentWeek = ((weeksSinceStart % 52) + 1);
  let currentTerm = 'Autumn';
  if (currentWeek >= 15 && currentWeek <= 28) currentTerm = 'Spring';
  if (currentWeek >= 29 && currentWeek <= 42) currentTerm = 'Summer';
  if (currentWeek > 42) currentTerm = 'Summer Holidays';
  
  return { currentWeek, currentTerm };
}

function normalizeSubject(subject: string): string {
  const normalized = subject.toLowerCase();
  if (normalized.includes('biology')) return 'GCSE Biology';
  if (normalized.includes('chemistry')) return 'GCSE Chemistry';
  if (normalized.includes('physics')) return 'GCSE Physics';
  if (normalized.includes('maths')) return 'GCSE Maths';
  if (normalized.includes('english')) return 'GCSE English';
  return subject;
}

async function findWeeklyTopic(supabase: any, lesson: LessonData): Promise<string> {
  const { currentWeek, currentTerm } = getAcademicWeekInfo();
  const normalizedSubject = normalizeSubject(lesson.subject);
  
  const { data: lessonPlan } = await supabase
    .from('lesson_plans')
    .select('topic_title')
    .eq('subject', normalizedSubject)
    .eq('week_number', currentWeek)
    .eq('term', currentTerm)
    .single();
  
  return lessonPlan?.topic_title || normalizedSubject.replace('GCSE ', '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const { data: lessons } = await supabase
      .from('lessons')
      .select(`
        id, title, subject, start_time,
        students!inner (
          id, first_name, email, phone, year_group,
          parents!inner (first_name, email, whatsapp_number)
        )
      `)
      .gte('start_time', tomorrow.toISOString())
      .lt('start_time', dayAfter.toISOString())
      .eq('status', 'scheduled');

    const gcseStudents = (lessons || []).filter(lesson => {
      const student = lesson.students as any;
      const yearGroup = student?.year_group?.toLowerCase() || '';
      return (yearGroup.includes('gcse') || yearGroup.includes('year 10') || yearGroup.includes('year 11')) &&
             VALID_CLEO_SUBJECTS.some(s => lesson.subject.toLowerCase().includes(s));
    });

    let sent = 0;

    for (const lesson of gcseStudents) {
      const student = lesson.students as any;
      const parent = student.parents?.[0] as any;
      const topicName = await findWeeklyTopic(supabase, lesson);
      
      const recipientEmail = parent?.email || student.email;
      const recipientName = parent?.first_name || student.first_name;
      const recipientPhone = parent?.whatsapp_number || student.phone;

      if (recipientEmail) {
        try {
          await sendEmail(recipientEmail, recipientName, student.first_name, lesson.subject, lesson.start_time, topicName);
          sent++;
        } catch (e) {
          console.error('Email failed:', e);
        }
      }

      if (recipientPhone) {
        try {
          await sendWhatsApp(recipientPhone, recipientName, student.first_name, lesson.subject, lesson.start_time, topicName);
          sent++;
        } catch (e) {
          console.error('WhatsApp failed:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, lessonsFound: gcseStudents.length, notificationsSent: sent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendEmail(email: string, recipientName: string, studentName: string, subject: string, startTime: string, topicName: string) {
  const date = new Date(startTime);
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1fb86b, #35d086); color: white; padding: 30px; border-radius: 10px; text-align: center;">
        <h1>🎓 Get Ready for Tomorrow's ${subject} Lesson!</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px;">
        <p>Hi ${recipientName},</p>
        <p><strong>${studentName}</strong> has a ${subject} lesson tomorrow at ${timeStr}.</p>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <h3>⚠️ REQUIRED PRE-LESSON PREPARATION</h3>
        </div>
        
        <h3>📚 Prepare with Cleo AI:</h3>
        <ol>
          <li>Visit <a href="https://classclowncrm.com/learning-hub">Learning Hub</a></li>
          <li>Go to "My Courses" → ${subject}</li>
          <li><strong>Search for: "${topicName}"</strong></li>
          <li>Complete a 10-15 minute Cleo lesson</li>
        </ol>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="https://classclowncrm.com/learning-hub" style="background: linear-gradient(135deg, #1fb86b, #35d086); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Start Now</a>
        </div>
      </div>
    </body>
    </html>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'JB Tutors <noreply@classclowncrm.com>',
      to: [email],
      subject: `🎓 Pre-Lesson Prep: ${subject} tomorrow at ${timeStr}`,
      html,
    }),
  });
}

async function sendWhatsApp(phone: string, recipientName: string, studentName: string, subject: string, startTime: string, topicName: string) {
  const date = new Date(startTime);
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });

  const message = `🎓 *Get Ready for Tomorrow's ${subject} Lesson!*

Hi ${recipientName},

${studentName} has a ${subject} lesson tomorrow at ${timeStr}.

⚠️ *REQUIRED PREPARATION*

📚 *Prepare with Cleo:*
1️⃣ Visit: https://classclowncrm.com/learning-hub
2️⃣ Go to "My Courses" → *${subject}*
3️⃣ *Search for: "${topicName}"*
4️⃣ Complete a 10-15 min Cleo lesson

This will help ${studentName} arrive prepared! 🚀`;

  await fetch('https://api.wazzup24.com/v3/message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('WAZZUP_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chatId: `${phone}@c.us`,
      chatType: 'whatsapp',
      text: message,
    }),
  });
}
