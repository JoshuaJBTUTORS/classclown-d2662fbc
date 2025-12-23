import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { RegularLessonReminderEmail } from './_templates/regular-lesson-reminder-email.tsx'
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';
import { convertUTCToUK, formatInUKTime } from '../_shared/timezone-utils.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting helper function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry helper for rate limited requests
const sendEmailWithRetry = async (emailData: any, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send(emailData);
      return result;
    } catch (error: any) {
      if (error.statusCode === 429 && attempt < maxRetries) {
        console.log(`Rate limited, retrying in ${attempt * 1000}ms... (attempt ${attempt}/${maxRetries})`);
        await sleep(attempt * 1000); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
};

interface LessonReminderRequest {
  timeframe: 'today' | 'tomorrow';
  scheduled_run?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Holiday period check - disable reminders until Jan 3rd 2026
  const now = new Date();
  const resumeDate = new Date('2026-01-03T00:00:00Z');
  if (now < resumeDate) {
    console.log('Reminders paused for holiday period until Jan 3rd 2026');
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Reminders paused for holiday period',
      paused: true
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { timeframe, scheduled_run }: LessonReminderRequest = await req.json();
    console.log(`Processing regular lesson reminders for ${timeframe}`, scheduled_run ? `(scheduled: ${scheduled_run})` : '');
    
    const isToday = timeframe === 'today';
    const targetDate = new Date();
    if (!isToday) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    const dateStr = targetDate.toISOString().split('T')[0];
    console.log(`Target date: ${dateStr}`);

    // Query regular lessons (excluding trial lessons) with student and parent info
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        *,
        lesson_students!inner (
          student:students!inner (
            id,
            first_name,
            last_name,
            email,
            parent:parents (
              id,
              first_name,
              last_name,
              email,
              phone,
              whatsapp_number
            )
          )
        )
      `)
      .eq('lesson_type', 'regular')
      .gte('start_time', `${dateStr}T00:00:00`)
      .lt('start_time', `${dateStr}T23:59:59`)
      .eq('status', 'scheduled');

    if (lessonsError) {
      console.error('Error fetching lessons:', lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} regular lessons for ${dateStr}`);

    if (!lessons || lessons.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `No regular lessons found for ${timeframe}`,
        emailsSent: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];
    let emailIndex = 0;
    let cancelledLessons = 0;
    let excusedStudents = 0;

    // Process each lesson and check for cancellation status
    const activeLessons = [];
    
    for (const lesson of lessons) {
      // Get attendance data for this lesson
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('lesson_attendance')
        .select('student_id, attendance_status')
        .eq('lesson_id', lesson.id);

      if (attendanceError) {
        console.warn(`Could not fetch attendance for lesson ${lesson.id}:`, attendanceError);
        // If we can't get attendance data, assume lesson is active
        activeLessons.push(lesson);
        continue;
      }

      // Check if all students in this lesson are marked as 'excused'
      const totalStudents = lesson.lesson_students.length;
      const excusedCount = attendanceData?.filter(att => att.attendance_status === 'excused').length || 0;
      
      if (excusedCount > 0 && excusedCount === totalStudents) {
        // All students are excused - lesson is cancelled
        console.log(`Skipping cancelled lesson ${lesson.id} (${lesson.title}) - all ${totalStudents} students excused`);
        cancelledLessons++;
        continue;
      }

      // Filter out excused students from this lesson
      const attendanceMap = new Map(attendanceData?.map(att => [att.student_id, att.attendance_status]) || []);
      lesson.activeStudents = lesson.lesson_students.filter(ls => {
        const isExcused = attendanceMap.get(ls.student.id) === 'excused';
        if (isExcused) {
          excusedStudents++;
          console.log(`Skipping excused student ${ls.student.first_name} ${ls.student.last_name} for lesson ${lesson.id}`);
        }
        return !isExcused;
      });

      if (lesson.activeStudents.length > 0) {
        activeLessons.push(lesson);
      }
    }

    // Count total emails to send for progress tracking (only for active students)
    const totalEmails = activeLessons.reduce((count, lesson) => 
      count + lesson.activeStudents.length, 0);
    
    console.log(`Found ${lessons.length} lessons, skipped ${cancelledLessons} cancelled lessons, excused ${excusedStudents} individual students`);
    console.log(`Preparing to send ${totalEmails} reminder emails with rate limiting...`);

    // Process each active lesson
    for (const lesson of activeLessons) {
      try {
        // Process each active student in the lesson
        for (const lessonStudent of lesson.activeStudents) {
          emailIndex++;
          const student = lessonStudent.student;
          const parent = student.parent;

          if (!parent || !parent.email) {
            console.warn(`No parent email found for student ${student.first_name} ${student.last_name}`);
            continue;
          }

          // Format UTC times directly to UK timezone - no double conversion
          const lessonDate = formatInUKTime(lesson.start_time, 'EEEE, dd MMMM yyyy');
          const lessonTime = `${formatInUKTime(lesson.start_time, 'HH:mm')} - ${formatInUKTime(lesson.end_time, 'HH:mm')}`;

          // Generate email HTML
          const emailHtml = await renderAsync(
            React.createElement(RegularLessonReminderEmail, {
              studentName: `${student.first_name} ${student.last_name}`,
              parentName: `${parent.first_name} ${parent.last_name}`,
              lessonTitle: lesson.title,
              lessonSubject: lesson.subject || 'Tutoring Session',
              lessonDate,
              lessonTime,
              studentEmail: student.email || '',
              dashboardUrl: 'https://classclowncrm.com/',
              isToday,
            })
          );

          console.log(`Sending email ${emailIndex}/${totalEmails} to ${parent.email}...`);

          // Send email with retry logic
          const emailResult = await sendEmailWithRetry({
            from: 'Class Beyond <lessons@classbeyondacademy.io>',
            to: [parent.email],
            subject: `Lesson Reminder - ${lesson.subject || 'Tutoring'} ${isToday ? 'Today' : 'Tomorrow'}`,
            html: emailHtml,
          });

          // Rate limiting: wait 600ms between emails (allowing ~1.6 emails per second)
          if (emailIndex < totalEmails) {
            await sleep(600);
          }

          if (emailResult.error) {
            console.error(`Failed to send email to ${parent.email}:`, emailResult.error);
            errors.push(`Failed to send to ${parent.email}: ${emailResult.error.error || emailResult.error.message || JSON.stringify(emailResult.error)}`);
          } else {
            console.log(`Email sent successfully to ${parent.email} for lesson ${lesson.id}`);
            emailsSent++;

            // Send WhatsApp message if phone number is available
            if (parent.phone || parent.whatsapp_number) {
              const whatsappText = WhatsAppTemplates.regularLessonReminder(
                `${parent.first_name} ${parent.last_name}`,
                `${student.first_name} ${student.last_name}`,
                lesson.title,
                lessonDate,
                lessonTime,
                isToday
              );

              const phoneNumber = parent.whatsapp_number || parent.phone;
              const whatsappNumber = whatsappService.formatPhoneNumber(phoneNumber);
              const whatsappResponse = await whatsappService.sendMessage({
                phoneNumber: whatsappNumber,
                text: whatsappText
              });

              console.log(`WhatsApp lesson reminder to ${whatsappNumber}:`, whatsappResponse);
            }
          }
        }
      } catch (lessonError) {
        console.error(`Error processing lesson ${lesson.id}:`, lessonError);
        errors.push(`Error processing lesson ${lesson.id}: ${lessonError.message}`);
      }
    }

    console.log(`Regular lesson reminders completed. Emails sent: ${emailsSent}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Regular lesson reminders processed for ${timeframe}`,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-lesson-reminder function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);