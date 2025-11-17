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
  end_time: string;
  student_id: number;
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  student_phone: string;
  year_group: string;
  parent_id: string | null;
  parent_first_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  parent_whatsapp: string | null;
}

interface CleoTopic {
  topic: string;
  year_group: string;
}

interface WeeklyTopicMatch {
  found: boolean;
  subject: string;
  weekNumber: number;
  term: string;
  topicTitle: string | null;
  searchInstruction: string;
  cleoModuleId?: string;
  cleoLessonId?: string;
  cleoModuleLink?: string;
  cleoModuleTitle?: string;
}

// Valid Cleo GCSE subjects
const VALID_CLEO_SUBJECTS = [
  'biology', 'chemistry', 'physics', 'combined science',
  'maths', 'mathematics', 'english'
];

// Helper function to get current academic week and term
function getAcademicWeekInfo() {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Calculate academic year start (first Monday of September)
  const academicYearStart = now.getMonth() < 8 
    ? new Date(currentYear - 1, 8, 1)
    : new Date(currentYear, 8, 1);
  
  // Calculate weeks since start
  const weeksSinceStart = Math.floor(
    (now.getTime() - academicYearStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  
  const currentWeek = ((weeksSinceStart % 52) + 1);
  
  // Determine term (without "Term" suffix to match DB)
  let currentTerm = 'Autumn';
  if (currentWeek >= 15 && currentWeek <= 28) currentTerm = 'Spring';
  if (currentWeek >= 29 && currentWeek <= 42) currentTerm = 'Summer';
  if (currentWeek > 42) currentTerm = 'Summer Holidays';
  
  return { currentWeek, currentTerm };
}

// Helper function to normalize lesson subjects to match lesson_plans table
function normalizeSubjectForLessonPlans(lessonSubject: string, lessonTitle: string = ''): string {
  const normalized = lessonSubject.toLowerCase();
  const title = lessonTitle.toLowerCase();
  
  // Direct mappings
  if (normalized.includes('biology')) return 'GCSE Biology';
  if (normalized.includes('chemistry')) return 'GCSE Chemistry';
  if (normalized.includes('physics')) return 'GCSE Physics';
  
  // Maths handling with Foundation/Higher split
  if (normalized.includes('maths') || normalized.includes('mathematics')) {
    if (title.includes('foundation')) return 'GCSE Maths Foundation';
    if (title.includes('higher')) return 'GCSE Maths Higher';
    return 'GCSE Maths Foundation'; // Default to Foundation
  }
  
  if (normalized.includes('english language')) return 'GCSE English Language';
  if (normalized.includes('english literature')) return 'GCSE English Literature';
  if (normalized.includes('english')) return 'GCSE English'; // Generic English fallback
  if (normalized.includes('computer science')) return 'GCSE Computer Science';
  
  // Combined Science handling (will be resolved later)
  if (normalized.includes('combined science') || normalized.includes('combined sci')) {
    return 'Combined Science';
  }
  
  return lessonSubject; // Fallback
}

// Helper function to detect which branch of Combined Science
function detectCombinedScienceBranch(lessonTitle: string): string {
  const title = lessonTitle.toLowerCase();
  
  const bioKeywords = ['cell', 'enzyme', 'photosynthesis', 'respiration', 'organ', 'tissue', 'dna', 'gene', 'mitosis'];
  const chemKeywords = ['atom', 'molecule', 'reaction', 'periodic', 'element', 'acid', 'base', 'bond', 'ionic'];
  const physKeywords = ['force', 'energy', 'wave', 'motion', 'electricity', 'current', 'voltage', 'magnet', 'light'];
  
  const bioScore = bioKeywords.filter(kw => title.includes(kw)).length;
  const chemScore = chemKeywords.filter(kw => title.includes(kw)).length;
  const physScore = physKeywords.filter(kw => title.includes(kw)).length;
  
  if (chemScore > bioScore && chemScore > physScore) return 'GCSE Chemistry';
  if (physScore > bioScore && physScore > chemScore) return 'GCSE Physics';
  
  return 'GCSE Biology'; // Default to Biology
}

// Helper function to calculate fuzzy match score
function calculateMatchScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 75;
  
  // Word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);
  
  return (commonWords / totalWords) * 60;
}

// Helper function to find Cleo module/lesson for weekly topic
async function findCleoModuleForWeeklyTopic(
  subject: string,
  topicTitle: string,
  supabase: any
): Promise<{ moduleId?: string; lessonId?: string; moduleLink?: string; moduleTitle?: string }> {
  try {
    // First, check explicit mappings
    const { data: mapping, error: mappingError } = await supabase
      .from('weekly_topic_module_mappings')
      .select('course_module_id, course_lesson_id, course_modules!inner(id, title, course_id)')
      .eq('subject', subject)
      .eq('weekly_topic_title', topicTitle)
      .order('confidence_score', { ascending: false })
      .single();
    
    if (!mappingError && mapping) {
      const courseId = mapping.course_modules.course_id;
      const moduleId = mapping.course_module_id;
      const moduleTitle = mapping.course_modules.title;
      const link = `https://classclowncrm.com/learning-hub/courses/${courseId}/modules/${moduleId}`;
      
      return {
        moduleId,
        lessonId: mapping.course_lesson_id,
        moduleLink: link,
        moduleTitle
      };
    }
    
    // Fallback: Fuzzy matching for Biology/Maths
    if (subject.includes('Biology') || subject.includes('Maths')) {
      // Find the course
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('subject', subject.replace('GCSE ', ''))
        .eq('status', 'published')
        .single();
      
      if (course) {
        // Get all modules for this course
        const { data: modules } = await supabase
          .from('course_modules')
          .select('id, title, course_id')
          .eq('course_id', course.id);
        
        if (modules && modules.length > 0) {
          // Find best matching module
          let bestMatch = null;
          let bestScore = 0;
          
          for (const module of modules) {
            const score = calculateMatchScore(topicTitle, module.title);
            if (score > bestScore && score >= 50) { // Minimum 50% match
              bestScore = score;
              bestMatch = module;
            }
          }
          
          if (bestMatch) {
            const link = `https://classclowncrm.com/learning-hub/courses/${bestMatch.course_id}/modules/${bestMatch.id}`;
            console.log(`🎯 Fuzzy matched "${topicTitle}" to "${bestMatch.title}" (${bestScore}% confidence)`);
            
            return {
              moduleId: bestMatch.id,
              moduleLink: link,
              moduleTitle: bestMatch.title
            };
          }
        }
      }
    }
    
    return {};
  } catch (error) {
    console.error('Error finding Cleo module:', error);
    return {};
  }
}

// Main function to find weekly topic for a lesson
async function findWeeklyTopicForLesson(
  supabase: any,
  lesson: LessonData
): Promise<WeeklyTopicMatch> {
  
  // Step 1: Get current academic week
  const { currentWeek, currentTerm } = getAcademicWeekInfo();
  
  console.log(`Current academic week: ${currentWeek}, Term: ${currentTerm}`);
  
  // Step 2: Normalize subject
  let normalizedSubject = normalizeSubjectForLessonPlans(lesson.subject);
  
  // Step 3: Handle Combined Science
  if (normalizedSubject === 'Combined Science') {
    normalizedSubject = detectCombinedScienceBranch(lesson.title);
    console.log(`Combined Science detected as: ${normalizedSubject}`);
  }
  
  // Step 4: Query lesson_plans table
  const { data: lessonPlan, error } = await supabase
    .from('lesson_plans')
    .select('topic_title, description')
    .eq('subject', normalizedSubject)
    .eq('week_number', currentWeek)
    .eq('term', currentTerm)
    .single();
  
  if (error) {
    console.log(`No lesson plan found for ${normalizedSubject} week ${currentWeek}:`, error.message);
  }
  
  // Step 5: Build result
  const topicTitle = lessonPlan?.topic_title || null;
  
  const searchInstruction = topicTitle
    ? `Search for "${topicTitle}" on heycleo.io`
    : `Browse ${normalizedSubject} topics related to your lesson`;
  
  // Step 6: Try to find matching Cleo module
  let cleoMatch = { moduleId: undefined, lessonId: undefined, moduleLink: undefined, moduleTitle: undefined };
  if (topicTitle) {
    cleoMatch = await findCleoModuleForWeeklyTopic(normalizedSubject, topicTitle, supabase);
    if (cleoMatch.moduleLink) {
      console.log(`🎓 Found Cleo Module: "${cleoMatch.moduleTitle}" - ${cleoMatch.moduleLink}`);
    }
  }
  
  return {
    found: !!topicTitle,
    subject: normalizedSubject,
    weekNumber: currentWeek,
    term: currentTerm,
    topicTitle,
    searchInstruction,
    cleoModuleId: cleoMatch.moduleId,
    cleoLessonId: cleoMatch.lessonId,
    cleoModuleLink: cleoMatch.moduleLink,
    cleoModuleTitle: cleoMatch.moduleTitle
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting pre-lesson prep notification job...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate tomorrow's date in UK timezone
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log(`Checking for lessons on ${tomorrowStr}`);

    // Query tomorrow's GCSE lessons
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id, title, subject, start_time, end_time,
        lesson_students!inner(
          student:students!inner(
            id, first_name, last_name, email, phone, grade,
            parent:parents(id, first_name, email, phone, whatsapp_number)
          )
        )
      `)
      .gte('start_time', `${tomorrowStr}T00:00:00`)
      .lt('start_time', `${tomorrowStr}T23:59:59`)
      .eq('status', 'scheduled')
      .eq('lesson_type', 'regular');

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} lessons for tomorrow`);

    if (!lessons || lessons.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No lessons found for tomorrow',
        lessons_found: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process lessons and filter for GCSE students
    const gcseStudents: LessonData[] = [];
    
    for (const lesson of lessons) {
      for (const ls of (lesson as any).lesson_students) {
        const student = ls.student;
        const parent = student.parent;
        
        // Check if GCSE student
        const isGCSE = student.grade?.toLowerCase().includes('gcse') ||
                       student.grade?.toLowerCase().includes('11') ||
                       lesson.subject?.toLowerCase().includes('gcse') ||
                       lesson.title?.toLowerCase().includes('gcse');
        
        // Check if subject is a valid Cleo subject
        const normalizedSubject = lesson.subject?.toLowerCase() || '';
        const isCleoSubject = VALID_CLEO_SUBJECTS.some(validSubject => 
          normalizedSubject.includes(validSubject)
        );
        
        if (isGCSE && isCleoSubject) {
          gcseStudents.push({
            id: lesson.id,
            title: lesson.title,
            subject: lesson.subject,
            start_time: lesson.start_time,
            end_time: lesson.end_time,
            student_id: student.id,
            student_first_name: student.first_name,
            student_last_name: student.last_name,
            student_email: student.email,
            student_phone: student.phone,
            year_group: student.grade,
            parent_id: parent?.id || null,
            parent_first_name: parent?.first_name || null,
            parent_email: parent?.email || null,
            parent_phone: parent?.phone || null,
            parent_whatsapp: parent?.whatsapp_number || null,
          });
        }
      }
    }

    console.log(`Found ${gcseStudents.length} GCSE students to notify`);

    let emailsSent = 0;
    let whatsappSent = 0;
    const errors: string[] = [];

    // Process each student
    for (const studentLesson of gcseStudents) {
      try {
        // Find matching weekly topic from lesson plans
        const topicMatch = await findWeeklyTopicForLesson(supabase, studentLesson);
        
        console.log(`Lesson: ${studentLesson.title}`);
        console.log(`Matched Topic: ${topicMatch.topicTitle || 'None'}`);
        console.log(`Instruction: ${topicMatch.searchInstruction}`);
        
        // Send email to parent (or student if no parent)
        const recipientEmail = studentLesson.parent_email || studentLesson.student_email;
        const recipientName = studentLesson.parent_first_name || studentLesson.student_first_name;
        
        if (recipientEmail) {
          await sendEmail(
            recipientEmail,
            recipientName,
            studentLesson.student_first_name,
            studentLesson.subject,
            studentLesson.title,
            studentLesson.start_time,
            topicMatch.topicTitle || topicMatch.subject
          );
          emailsSent++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        }

        // Send WhatsApp to parent
        if (studentLesson.parent_whatsapp) {
          await sendWhatsApp(
            studentLesson.parent_whatsapp,
            studentLesson.student_first_name,
            studentLesson.subject,
            studentLesson.start_time,
            topicMatch.topicTitle || topicMatch.subject,
            topicMatch.searchInstruction,
            topicMatch.cleoModuleLink,
            topicMatch.cleoModuleTitle
          );
          whatsappSent++;
          await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
        }

      } catch (error) {
        console.error(`Error processing student ${studentLesson.student_id}:`, error);
        errors.push(`Student ${studentLesson.student_id}: ${error.message}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      lessons_found: lessons.length,
      gcse_students: gcseStudents.length,
      emails_sent: emailsSent,
      whatsapp_sent: whatsappSent,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-pre-lesson-prep:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function findCleoTopic(supabase: any, subject: string, lessonTitle: string): Promise<string> {
  // Extract core subject (remove "GCSE" prefix)
  const coreSubject = subject.replace(/GCSE\s*/i, '').trim();
  
  // Try to find matching topic in Cleo lesson plans
  const { data: topics } = await supabase
    .from('cleo_lesson_plans')
    .select('topic, year_group')
    .ilike('year_group', `%${coreSubject}%`)
    .eq('status', 'ready')
    .limit(10);

  if (topics && topics.length > 0) {
    // Try to find best match based on lesson title
    const titleKeywords = lessonTitle.toLowerCase().split(/\s+/);
    for (const topic of topics) {
      const topicLower = topic.topic.toLowerCase();
      if (titleKeywords.some(keyword => topicLower.includes(keyword))) {
        return topic.topic;
      }
    }
    // Return first topic as fallback
    return topics[0].topic;
  }

  // Fallback: suggest browsing the subject
  return coreSubject;
}

async function sendEmail(
  email: string,
  recipientName: string,
  studentName: string,
  subject: string,
  lessonTopic: string,
  startTime: string,
  cleoTopic: string
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const date = new Date(startTime);
  const timeStr = date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/London'
  });
  const dateStr = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/London'
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1fb86b, #35d086); color: white; padding: 30px; border-radius: 10px; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 10px; margin-top: 20px; }
        .required { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .step { margin: 15px 0; padding: 10px; }
        .step-number { display: inline-block; width: 30px; height: 30px; background: #1fb86b; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 10px; font-weight: bold; }
        .button { display: inline-block; background: linear-gradient(135deg, #1fb86b, #35d086); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
        .lesson-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Get Ready for Tomorrow's ${subject} Lesson!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${recipientName},</p>
          
          <p><strong>${studentName}</strong> has a ${subject} lesson tomorrow at ${timeStr} with JB Tutors.</p>
          
          <div class="required">
            <h3>⚠️ REQUIRED PRE-LESSON PREPARATION</h3>
            <p><strong>Please complete this before tomorrow's lesson.</strong></p>
          </div>
          
          <h3>📚 Prepare with Cleo AI Tutor:</h3>
          
          <p>To ensure ${studentName} gets the most out of tomorrow's lesson, <strong>you should complete</strong> the following preparation using Cleo, your AI tutor:</p>
          
          <div class="steps">
            <div class="step">
              <span class="step-number">1</span>
              <strong>Visit and log in:</strong>
              <br><a href="https://classclowncrm.com/learning-hub" style="color: #1fb86b;">https://classclowncrm.com/learning-hub</a>
            </div>
            
            <div class="step">
              <span class="step-number">2</span>
              <strong>Go to "My Courses"</strong> and select <em>${subject}</em>
            </div>
            
            <div class="step">
              <span class="step-number">3</span>
              <strong>Search for the topic:</strong> "<em>${cleoTopic}</em>"
            </div>
            
            <div class="step">
              <span class="step-number">4</span>
              <strong>Please complete</strong> a 10-15 minute Cleo voice session on this topic
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://classclowncrm.com/learning-hub" class="button">Start Preparation Now →</a>
          </div>
          
          <h3>✅ This preparation will help ${studentName}:</h3>
          <ul>
            <li>Understand key concepts before the lesson</li>
            <li>Identify areas they need help with</li>
            <li>Make the most of their tutoring time</li>
            <li>Feel more confident during the lesson</li>
          </ul>
          
          <div class="lesson-details">
            <h3>📅 Tomorrow's Lesson Details:</h3>
            <p><strong>Date:</strong> ${dateStr}</p>
            <p><strong>Time:</strong> ${timeStr}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Topic:</strong> ${lessonTopic}</p>
          </div>
          
          <p>Looking forward to seeing ${studentName} tomorrow!</p>
          
          <p>Best regards,<br><strong>JB Tutors Team</strong></p>
        </div>
        
        <div class="footer">
          <p><em>💬 If you would like this message to be sent directly to ${studentName} alongside you, please reply to let us know.</em></p>
          <p>© ${new Date().getFullYear()} JB Tutors. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'JB Tutors <noreply@jbtutors.co.uk>',
      to: [email],
      subject: `Get Ready for Tomorrow's ${subject} Lesson! 🎓`,
      html: htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }

  console.log(`Email sent to ${email}`);
}

async function sendWhatsApp(
  phoneNumber: string,
  studentName: string,
  subject: string,
  startTime: string,
  topicTitle: string,
  searchInstruction: string,
  cleoModuleLink?: string,
  cleoModuleTitle?: string
) {
  const wazzupApiKey = Deno.env.get('WAZZUP_API_KEY');
  const wazzupChannelId = Deno.env.get('WAZZUP_CHANNEL_ID');
  
  if (!wazzupApiKey || !wazzupChannelId) {
    console.warn('WhatsApp not configured, skipping...');
    return;
  }

  const date = new Date(startTime);
  const timeStr = date.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/London'
  });

  // Format phone number
  let formattedPhone = phoneNumber.replace(/\s+/g, '');
  if (!formattedPhone.startsWith('+')) {
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+44' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('44')) {
      formattedPhone = '+' + formattedPhone;
    } else {
      formattedPhone = '+' + formattedPhone;
    }
  }

  // Build Cleo section if module link available
  const cleoSection = cleoModuleLink 
    ? `\n\n🎓 *Learn with Cleo AI:*\n👉 ${cleoModuleTitle}\n🔗 ${cleoModuleLink}\n\nGet ahead by exploring this topic on Cleo before your lesson!`
    : '';

  const message = `🦊 *Pre-Lesson Prep with Cleo!*

Hi! ${studentName} has ${subject} tomorrow at ${timeStr}. 📚

This week you'll be learning about:
📖 *${topicTitle}*

🎯 *Get prepared:*
${searchInstruction}${cleoSection}

See you in class! 👋

_💬 If you'd like this sent to ${studentName} directly too, please reply._`;

  const response = await fetch('https://api.wazzup24.com/v3/message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${wazzupApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channelId: wazzupChannelId,
      chatId: `${formattedPhone}@c.us`,
      chatType: 'whatsapp',
      text: message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WhatsApp send failed: ${error}`);
  }

  console.log(`WhatsApp sent to ${formattedPhone}`);
}
