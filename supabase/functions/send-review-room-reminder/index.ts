import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { ReviewRoomReminderEmail } from './_templates/review-room-reminder-email.tsx'
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

const FALLBACK_REVIEW_ROOM_URL = 'https://www.thelessonspace.com/space/3b3388bf-7e1f-4276-9f37-de5b17053e84';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sendEmailWithRetry = async (emailData: any, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await resend.emails.send(emailData);
    } catch (error: any) {
      if (error.statusCode === 429 && attempt < maxRetries) {
        console.log(`Rate limited, retry ${attempt}/${maxRetries}`);
        await sleep(attempt * 1000);
        continue;
      }
      throw error;
    }
  }
};

interface ReminderRequest {
  timeframe: 'today' | 'tomorrow';
  scheduled_run?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { timeframe, scheduled_run }: ReminderRequest = await req.json();
    console.log(`Processing Review Room reminders for ${timeframe}`, scheduled_run ? `(scheduled: ${scheduled_run})` : '');

    const isToday = timeframe === 'today';
    const targetDate = new Date();
    if (!isToday) targetDate.setDate(targetDate.getDate() + 1);
    const dateStr = targetDate.toISOString().split('T')[0];
    console.log(`Target date: ${dateStr}`);

    // Fetch all Review Room lessons for the target date with enrolled students + parents
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id, title, subject, start_time, end_time, lesson_space_room_url,
        lesson_students (
          student:students (
            id, first_name, last_name, email,
            parent:parents (
              id, first_name, last_name, email, phone, whatsapp_number
            )
          )
        )
      `)
      .eq('lesson_type', 'review_room')
      .gte('start_time', `${dateStr}T00:00:00`)
      .lt('start_time', `${dateStr}T23:59:59`)
      .eq('status', 'scheduled');

    if (lessonsError) {
      console.error('Error fetching review room lessons:', lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} review room lessons for ${dateStr}`);

    if (!lessons || lessons.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: `No review room lessons found for ${timeframe}`,
        emailsSent: 0,
      }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    let emailsSent = 0;
    const errors: string[] = [];
    let emailIndex = 0;

    // Build a flat list of (lesson, student, parent) tuples — dedupe per parent+lesson
    type Recipient = {
      lesson: any;
      student: any;
      parent: any;
    };
    const recipients: Recipient[] = [];
    const seen = new Set<string>();

    for (const lesson of lessons) {
      for (const ls of lesson.lesson_students || []) {
        const student = ls.student;
        const parent = student?.parent;
        if (!parent || !parent.email) {
          console.warn(`Skipping student without parent email for lesson ${lesson.id}`);
          continue;
        }
        const key = `${lesson.id}::${parent.email.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        recipients.push({ lesson, student, parent });
      }
    }

    console.log(`Preparing to send ${recipients.length} review room reminder emails...`);

    for (const { lesson, student, parent } of recipients) {
      emailIndex++;
      try {
        const lessonDate = formatInUKTime(lesson.start_time, 'EEEE, dd MMMM yyyy');
        const lessonTime = `${formatInUKTime(lesson.start_time, 'HH:mm')} - ${formatInUKTime(lesson.end_time, 'HH:mm')}`;
        const childName = `${student.first_name} ${student.last_name}`.trim() || 'your child';
        const parentName = `${parent.first_name || ''} ${parent.last_name || ''}`.trim() || 'Parent';
        const lessonUrl = lesson.lesson_space_room_url || FALLBACK_REVIEW_ROOM_URL;

        const emailHtml = await renderAsync(
          React.createElement(ReviewRoomReminderEmail, {
            childName,
            parentName,
            lessonTitle: lesson.title,
            lessonSubject: lesson.subject || 'Review Room',
            lessonDate,
            lessonTime,
            lessonUrl,
            isToday,
          })
        );

        console.log(`Sending review room email ${emailIndex}/${recipients.length} to ${parent.email}...`);

        const emailResult: any = await sendEmailWithRetry({
          from: 'Class Beyond <lessons@classbeyondacademy.io>',
          to: [parent.email],
          subject: `Review Room ${isToday ? 'Today' : 'Tomorrow'} - ${childName}`,
          html: emailHtml,
        });

        if (emailIndex < recipients.length) await sleep(600);

        if (emailResult?.error) {
          console.error(`Failed to email ${parent.email}:`, emailResult.error);
          errors.push(`Failed to send to ${parent.email}: ${emailResult.error.message || JSON.stringify(emailResult.error)}`);
        } else {
          console.log(`Review room email sent to ${parent.email} for lesson ${lesson.id}`);
          emailsSent++;

          // WhatsApp
          const phone = parent.whatsapp_number || parent.phone;
          if (phone) {
            try {
              const whatsappText = WhatsAppTemplates.reviewRoomReminder({
                parentName,
                childName,
                lessonDate,
                lessonTime,
                lessonUrl,
                isToday,
              });
              const formatted = whatsappService.formatPhoneNumber(phone);
              const wa = await whatsappService.sendMessage({ phoneNumber: formatted, text: whatsappText });
              console.log(`WhatsApp review room reminder sent to ${formatted}:`, wa);
            } catch (waErr: any) {
              console.warn(`WhatsApp send failed for ${phone}:`, waErr?.message || waErr);
            }
          }
        }
      } catch (recipientError: any) {
        console.error(`Error processing recipient for lesson ${lesson.id}:`, recipientError);
        errors.push(`Error for lesson ${lesson.id}: ${recipientError?.message || recipientError}`);
      }
    }

    console.log(`Review room reminders complete. Emails sent: ${emailsSent}, Errors: ${errors.length}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Review room reminders processed for ${timeframe}`,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });

  } catch (error: any) {
    console.error("Error in send-review-room-reminder:", error);
    return new Response(JSON.stringify({ error: error?.message || String(error), success: false }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
