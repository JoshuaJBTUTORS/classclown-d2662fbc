import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { RegularLessonReminderEmail } from './_templates/regular-lesson-reminder-email.tsx'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LessonReminderRequest {
  timeframe: 'today' | 'tomorrow';
  scheduled_run?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
              email
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

    // Process each lesson
    for (const lesson of lessons) {
      try {
        // Process each student in the lesson
        for (const lessonStudent of lesson.lesson_students) {
          const student = lessonStudent.student;
          const parent = student.parent;

          if (!parent || !parent.email) {
            console.warn(`No parent email found for student ${student.first_name} ${student.last_name}`);
            continue;
          }

          const startTime = new Date(lesson.start_time);
          const endTime = new Date(lesson.end_time);
          
          const lessonDate = startTime.toLocaleDateString('en-GB', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          
          const lessonTime = `${startTime.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })} - ${endTime.toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}`;

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
              dashboardUrl: `${supabaseUrl.replace('.supabase.co', '')}.lovableproject.com/dashboard`,
              isToday,
            })
          );

          // Send email
          const emailResult = await resend.emails.send({
            from: 'JB Tutors <lessons@jb-tutors.com>',
            to: [parent.email],
            subject: `Lesson Reminder - ${lesson.subject || 'Tutoring'} ${isToday ? 'Today' : 'Tomorrow'}`,
            html: emailHtml,
          });

          if (emailResult.error) {
            console.error(`Failed to send email to ${parent.email}:`, emailResult.error);
            errors.push(`Failed to send to ${parent.email}: ${emailResult.error.error || emailResult.error.message || JSON.stringify(emailResult.error)}`);
          } else {
            console.log(`Email sent successfully to ${parent.email} for lesson ${lesson.id}`);
            emailsSent++;
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