import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { TrialLessonReminderEmail } from './_templates/trial-lesson-reminder-email.tsx'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrialLessonReminderRequest {
  timeframe: 'today' | 'tomorrow';
  scheduled_run?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timeframe, scheduled_run }: TrialLessonReminderRequest = await req.json();
    console.log(`Processing trial lesson reminders for ${timeframe}`, scheduled_run ? `(scheduled: ${scheduled_run})` : '');
    
    const isToday = timeframe === 'today';
    const targetDate = new Date();
    if (!isToday) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    const dateStr = targetDate.toISOString().split('T')[0];
    console.log(`Target date: ${dateStr}`);

    // Query trial lessons for the target date
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('lesson_type', 'trial')
      .gte('start_time', `${dateStr}T00:00:00`)
      .lt('start_time', `${dateStr}T23:59:59`)
      .eq('status', 'scheduled')
      .not('trial_booking_id', 'is', null);

    if (lessonsError) {
      console.error('Error fetching trial lessons:', lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} trial lessons for ${dateStr}`);

    if (!lessons || lessons.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: `No trial lessons found for ${timeframe}`,
        emailsSent: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let emailsSent = 0;
    const errors: string[] = [];

    // Process each trial lesson
    for (const lesson of lessons) {
      try {
        // Fetch the trial booking data separately
        const { data: trialBooking, error: bookingError } = await supabase
          .from('trial_bookings')
          .select('id, parent_name, child_name, email, phone')
          .eq('id', lesson.trial_booking_id)
          .single();

        if (bookingError || !trialBooking || !trialBooking.email) {
          console.warn(`No trial booking email found for lesson ${lesson.id}:`, bookingError);
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

        // Use child name from trial booking
        const childName = trialBooking.child_name || 'your child';

        // Generate lesson URL - for trial lessons, this could be the lesson space URL or a direct join link
        const lessonUrl = lesson.lesson_space_room_url || 
                          `${supabaseUrl.replace('.supabase.co', '')}.lovableproject.com/student-join/${lesson.id}`;

        // Generate email HTML
        const emailHtml = await renderAsync(
          React.createElement(TrialLessonReminderEmail, {
            childName,
            parentName: trialBooking.parent_name || 'Parent',
            lessonTitle: lesson.title,
            lessonSubject: lesson.subject || 'Trial Session',
            lessonDate,
            lessonTime,
            lessonUrl,
            isToday,
          })
        );

        // Send email
        const emailResult = await resend.emails.send({
          from: 'JB Tutors <lessons@jbtutors.co.uk>',
          to: [trialBooking.email],
          subject: `Exciting Trial Lesson ${isToday ? 'Today' : 'Tomorrow'} - ${lesson.subject || 'Tutoring'}`,
          html: emailHtml,
        });

        if (emailResult.error) {
          console.error(`Failed to send trial email to ${trialBooking.email}:`, emailResult.error);
          errors.push(`Failed to send to ${trialBooking.email}: ${emailResult.error.message}`);
        } else {
          console.log(`Trial email sent successfully to ${trialBooking.email} for lesson ${lesson.id}`);
          emailsSent++;
        }

      } catch (lessonError) {
        console.error(`Error processing trial lesson ${lesson.id}:`, lessonError);
        errors.push(`Error processing trial lesson ${lesson.id}: ${lessonError.message}`);
      }
    }

    console.log(`Trial lesson reminders completed. Emails sent: ${emailsSent}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Trial lesson reminders processed for ${timeframe}`,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-trial-lesson-reminder function:", error);
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