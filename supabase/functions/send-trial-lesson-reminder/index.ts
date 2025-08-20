import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { TrialLessonReminderEmail } from './_templates/trial-lesson-reminder-email.tsx'
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

    // Query both demo and trial lessons for the target date
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('lesson_type', ['trial', 'demo'])
      .gte('start_time', `${dateStr}T00:00:00`)
      .lt('start_time', `${dateStr}T23:59:59`)
      .eq('status', 'scheduled')
      .not('trial_booking_id', 'is', null);

    if (lessonsError) {
      console.error('Error fetching trial lessons:', lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} demo and trial lessons for ${dateStr}`);

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

    // Group lessons by trial_booking_id to process each trial booking once
    const lessonsByBooking = new Map();
    for (const lesson of lessons) {
      if (!lessonsByBooking.has(lesson.trial_booking_id)) {
        lessonsByBooking.set(lesson.trial_booking_id, []);
      }
      lessonsByBooking.get(lesson.trial_booking_id).push(lesson);
    }

    let emailsSent = 0;
    const errors: string[] = [];
    let emailIndex = 0;

    console.log(`Preparing to send ${lessonsByBooking.size} trial lesson reminder emails with rate limiting...`);

    // Process each trial booking
    for (const [trialBookingId, bookingLessons] of lessonsByBooking) {
      emailIndex++;
      try {
        // Find demo and trial lessons
        const demoLesson = bookingLessons.find(l => l.lesson_type === 'demo');
        const trialLesson = bookingLessons.find(l => l.lesson_type === 'trial');
        
        // Skip if we don't have both sessions
        if (!demoLesson || !trialLesson) {
          console.warn(`Missing demo or trial lesson for booking ${trialBookingId}`);
          continue;
        }

        // Fetch the trial booking data separately
        const { data: trialBooking, error: bookingError } = await supabase
          .from('trial_bookings')
          .select('id, parent_name, child_name, email, phone')
          .eq('id', trialBookingId)
          .single();

        if (bookingError || !trialBooking || !trialBooking.email) {
          console.warn(`No trial booking email found for booking ${trialBookingId}:`, bookingError);
          continue;
        }

        // Use demo start time and trial end time for the complete session
        const sessionStartTime = demoLesson.start_time;
        const sessionEndTime = trialLesson.end_time;

        // Format UTC times directly to UK timezone - no double conversion
        const lessonDate = formatInUKTime(sessionStartTime, 'EEEE, dd MMMM yyyy');
        const lessonTime = `${formatInUKTime(sessionStartTime, 'HH:mm')} - ${formatInUKTime(sessionEndTime, 'HH:mm')}`;

        // Use child name from trial booking
        const childName = trialBooking.child_name || 'your child';

        // Generate lesson URL - use demo lesson URL since that's where they start
        const lessonUrl = demoLesson.lesson_space_room_url || 
                          `${supabaseUrl.replace('.supabase.co', '')}.lovableproject.com/student-join/${demoLesson.id}`;

        // Generate email HTML
        const emailHtml = await renderAsync(
          React.createElement(TrialLessonReminderEmail, {
            childName,
            parentName: trialBooking.parent_name || 'Parent',
            lessonTitle: trialLesson.title,
            lessonSubject: trialLesson.subject || 'Trial Session',
            lessonDate,
            lessonTime,
            lessonUrl,
            isToday,
          })
        );

        console.log(`Sending trial email ${emailIndex}/${lessonsByBooking.size} to ${trialBooking.email}...`);

        // Send email with retry logic
        const emailResult = await sendEmailWithRetry({
          from: 'JB Tutors <lessons@jb-tutors.com>',
          to: [trialBooking.email],
          subject: `Exciting Trial Lesson ${isToday ? 'Today' : 'Tomorrow'} - ${trialLesson.subject || 'Tutoring'}`,
          html: emailHtml,
        });

        // Rate limiting: wait 600ms between emails (allowing ~1.6 emails per second)
        if (emailIndex < lessonsByBooking.size) {
          await sleep(600);
        }

        if (emailResult.error) {
          console.error(`Failed to send trial email to ${trialBooking.email}:`, emailResult.error);
          errors.push(`Failed to send to ${trialBooking.email}: ${emailResult.error.message}`);
        } else {
          console.log(`Trial email sent successfully to ${trialBooking.email} for booking ${trialBookingId}`);
          emailsSent++;

          // Send WhatsApp message if phone number is available
          if (trialBooking.phone) {
            const whatsappText = WhatsAppTemplates.trialLessonReminder(
              trialBooking.parent_name || 'Parent',
              childName,
              trialLesson.title,
              lessonDate,
              lessonTime,
              lessonUrl,
              isToday
            );

            const whatsappNumber = whatsappService.formatPhoneNumber(trialBooking.phone);
            const whatsappResponse = await whatsappService.sendMessage({
              phoneNumber: whatsappNumber,
              text: whatsappText
            });

            console.log(`WhatsApp trial reminder to ${whatsappNumber}:`, whatsappResponse);
          }
        }

      } catch (lessonError) {
        console.error(`Error processing trial booking ${trialBookingId}:`, lessonError);
        errors.push(`Error processing trial booking ${trialBookingId}: ${lessonError.message}`);
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