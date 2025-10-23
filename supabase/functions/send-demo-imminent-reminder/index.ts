import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { DemoImminentEmail } from './_templates/demo-imminent-email.tsx'
import { DemoImminentAdminEmail } from './_templates/demo-imminent-admin-email.tsx'
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';
import { formatInUKTime } from '../_shared/timezone-utils.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sendEmailWithRetry = async (emailData: any, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send(emailData);
      return result;
    } catch (error: any) {
      if (error.statusCode === 429 && attempt < maxRetries) {
        console.log(`Rate limited, retrying in ${attempt * 1000}ms... (attempt ${attempt}/${maxRetries})`);
        await sleep(attempt * 1000);
        continue;
      }
      throw error;
    }
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting demo imminent reminder check...');
    
    // Calculate time window: 10-15 minutes from now
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
    
    console.log(`Checking for demos between ${tenMinutesFromNow.toISOString()} and ${fifteenMinutesFromNow.toISOString()}`);

    // Query for demo lessons starting in 10-15 minutes that haven't been reminded yet
    const { data: demoLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*, trial_bookings(*)')
      .eq('lesson_type', 'demo')
      .eq('status', 'scheduled')
      .eq('imminent_reminder_sent', false)
      .gte('start_time', tenMinutesFromNow.toISOString())
      .lt('start_time', fifteenMinutesFromNow.toISOString())
      .not('trial_booking_id', 'is', null);

    if (lessonsError) {
      console.error('Error fetching demo lessons:', lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${demoLessons?.length || 0} demo lessons requiring imminent reminders`);

    if (!demoLessons || demoLessons.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No demo lessons requiring imminent reminders',
        remindersSent: 0 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let remindersSent = 0;
    const errors: string[] = [];

    // Process each demo lesson
    for (const lesson of demoLessons) {
      try {
        const trialBooking = lesson.trial_bookings;
        
        if (!trialBooking || !trialBooking.email) {
          console.warn(`No trial booking data found for lesson ${lesson.id}`);
          continue;
        }

        // Format times for display
        const lessonTime = formatInUKTime(lesson.start_time, 'HH:mm');
        
        // Generate lesson URL
        const lessonUrl = lesson.lesson_space_room_id 
          ? `https://www.thelessonspace.com/space/${lesson.lesson_space_room_id}`
          : `${supabaseUrl.replace('.supabase.co', '')}.lovableproject.com/student-join/${lesson.id}`;

        // Send email to parent
        const parentEmailHtml = await renderAsync(
          React.createElement(DemoImminentEmail, {
            parentName: trialBooking.parent_name || 'Parent',
            childName: trialBooking.child_name || 'your child',
            lessonUrl,
            lessonTime,
          })
        );

        console.log(`Sending imminent demo reminder to parent: ${trialBooking.email}`);

        const parentEmailResult = await sendEmailWithRetry({
          from: 'JB Tutors <lessons@jb-tutors.com>',
          to: [trialBooking.email],
          subject: `🚨 STARTING IN 10 MINUTES - Demo Session for ${trialBooking.child_name}`,
          html: parentEmailHtml,
        });

        // Send WhatsApp to parent if phone is available
        if (trialBooking.phone) {
          const whatsappText = WhatsAppTemplates.demoImminentReminder(
            trialBooking.parent_name || 'Parent',
            trialBooking.child_name || 'your child',
            lessonUrl
          );

          const whatsappNumber = whatsappService.formatPhoneNumber(trialBooking.phone);
          const whatsappResponse = await whatsappService.sendMessage({
            phoneNumber: whatsappNumber,
            text: whatsappText
          });

          console.log(`WhatsApp imminent reminder to parent ${whatsappNumber}:`, whatsappResponse);
        }

        // Send email to admin (Joshua)
        const adminEmailHtml = await renderAsync(
          React.createElement(DemoImminentAdminEmail, {
            parentName: trialBooking.parent_name || 'Parent',
            childName: trialBooking.child_name || 'Child',
            parentEmail: trialBooking.email,
            parentPhone: trialBooking.phone || 'Not provided',
            lessonUrl,
            lessonTime,
          })
        );

        console.log('Sending imminent demo reminder to admin: joshua@jb-tutors.com');

        const adminEmailResult = await sendEmailWithRetry({
          from: 'JB Tutors Alerts <lessons@jb-tutors.com>',
          to: ['joshua@jb-tutors.com'],
          subject: `🚨 Demo Starting in 10 Min - ${trialBooking.parent_name} & ${trialBooking.child_name}`,
          html: adminEmailHtml,
        });

        // Send WhatsApp to admin (Joshua)
        const adminWhatsappText = WhatsAppTemplates.demoImminentReminderAdmin(
          trialBooking.parent_name || 'Parent',
          trialBooking.child_name || 'Child',
          trialBooking.email,
          trialBooking.phone || 'Not provided',
          lessonUrl
        );

        const adminWhatsappResponse = await whatsappService.sendMessage({
          phoneNumber: '+447413069120',
          text: adminWhatsappText
        });

        console.log('WhatsApp imminent reminder to admin +447413069120:', adminWhatsappResponse);

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('lessons')
          .update({ imminent_reminder_sent: true })
          .eq('id', lesson.id);

        if (updateError) {
          console.error(`Failed to mark reminder as sent for lesson ${lesson.id}:`, updateError);
          errors.push(`Failed to update lesson ${lesson.id}: ${updateError.message}`);
        } else {
          remindersSent++;
          console.log(`Successfully sent imminent reminders for lesson ${lesson.id}`);
        }

        // Rate limiting
        await sleep(600);

      } catch (lessonError: any) {
        console.error(`Error processing demo lesson ${lesson.id}:`, lessonError);
        errors.push(`Error processing lesson ${lesson.id}: ${lessonError.message}`);
      }
    }

    console.log(`Demo imminent reminders completed. Reminders sent: ${remindersSent}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Demo imminent reminders processed',
      remindersSent,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-demo-imminent-reminder function:", error);
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
