import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { HomeworkPolicyEmail } from './_templates/homework-policy-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Contact {
  email?: string;
  phone?: string;
  firstName: string;
  isParent: boolean;
  studentName?: string;
}

// WhatsApp service inline to avoid import issues
async function sendWhatsAppMessage(phoneNumber: string, text: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("WAZZUP_API_KEY");
  const channelId = Deno.env.get("WAZZUP_CHANNEL_ID");
  
  if (!apiKey || !channelId) {
    console.warn("WhatsApp service not configured");
    return { success: false, error: "WhatsApp service not configured" };
  }

  try {
    const response = await fetch("https://api.wazzup24.com/v3/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        channelId,
        chatId: phoneNumber,
        chatType: "whatsapp",
        text
      })
    });

    const responseData = await response.json();

    if (response.status >= 200 && response.status < 300) {
      return { success: true };
    } else {
      return { success: false, error: `HTTP ${response.status}: ${responseData.message || response.statusText}` };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

function formatPhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return `44${digitsOnly.slice(1)}`;
  }
  if (digitsOnly.startsWith('44')) {
    return digitsOnly;
  }
  return digitsOnly;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendEmailWithRetry(emailData: any, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await resend.emails.send(emailData);
      if (result.error) {
        if (result.error.message?.includes('rate') && attempt < maxRetries) {
          console.log(`Rate limited, waiting before retry ${attempt}/${maxRetries}`);
          await sleep(2000 * attempt);
          continue;
        }
        throw new Error(result.error.message);
      }
      return result;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(1000 * attempt);
    }
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testMode = false, testEmail, testPhone } = await req.json().catch(() => ({}));
    
    console.log(`Starting GCSE homework policy campaign. Test mode: ${testMode}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query lessons between Jan 2-9, 2026
    const startDate = "2026-01-02T00:00:00Z";
    const endDate = "2026-01-09T23:59:59Z";

    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select(`
        id,
        title,
        subject,
        lesson_students!inner (
          student_id,
          students!inner (
            id,
            first_name,
            last_name,
            email,
            phone,
            parent_id,
            parents:parent_id (
              id,
              first_name,
              last_name,
              email,
              phone
            )
          )
        )
      `)
      .gte("start_time", startDate)
      .lte("start_time", endDate);

    if (lessonsError) {
      console.error("Error fetching lessons:", lessonsError);
      throw lessonsError;
    }

    console.log(`Found ${lessons?.length || 0} lessons in date range`);

    // Filter for GCSE/Year 11 lessons
    const gcseKeywords = ['gcse', 'yr 11', 'year 11', 'yr11', 'year11'];
    const gcseLessons = lessons?.filter(lesson => {
      const titleLower = (lesson.title || '').toLowerCase();
      const subjectLower = (lesson.subject || '').toLowerCase();
      return gcseKeywords.some(keyword => 
        titleLower.includes(keyword) || subjectLower.includes(keyword)
      );
    }) || [];

    console.log(`Found ${gcseLessons.length} GCSE/Year 11 lessons`);

    // Collect unique contacts
    const parentContacts = new Map<string, Contact>();
    const studentContacts = new Map<string, Contact>();

    for (const lesson of gcseLessons) {
      for (const ls of lesson.lesson_students) {
        const student = ls.students;
        if (!student) continue;

        const studentKey = `student-${student.id}`;
        if (!studentContacts.has(studentKey)) {
          studentContacts.set(studentKey, {
            email: student.email || undefined,
            phone: student.phone || undefined,
            firstName: student.first_name || 'Student',
            isParent: false,
          });
        }

        const parent = student.parents;
        if (parent) {
          const parentKey = `parent-${parent.id}`;
          if (!parentContacts.has(parentKey)) {
            parentContacts.set(parentKey, {
              email: parent.email || undefined,
              phone: parent.phone || undefined,
              firstName: parent.first_name || 'Parent',
              isParent: true,
              studentName: `${student.first_name} ${student.last_name}`,
            });
          }
        }
      }
    }

    console.log(`Unique parents: ${parentContacts.size}, Unique students: ${studentContacts.size}`);

    const results = {
      parentEmailsSent: 0,
      parentEmailsFailed: 0,
      studentEmailsSent: 0,
      studentEmailsFailed: 0,
      parentWhatsAppSent: 0,
      parentWhatsAppFailed: 0,
      studentWhatsAppSent: 0,
      studentWhatsAppFailed: 0,
    };

    const allContacts = [...parentContacts.values(), ...studentContacts.values()];

    // If test mode, only send to test email/phone
    if (testMode) {
      console.log("Test mode enabled - sending to test recipients only");
      
      if (testEmail) {
        const html = await renderAsync(
          React.createElement(HomeworkPolicyEmail, {
            recipientName: "Test User",
            isParent: true,
          })
        );

        try {
          await sendEmailWithRetry({
            from: "JB Tutors <enquiries@classbeyondacademy.io>",
            to: [testEmail],
            subject: "Important Update: GCSE Homework Expectations for 2026",
            html,
          });
          console.log(`Test email sent to ${testEmail}`);
        } catch (error) {
          console.error(`Test email failed:`, error);
        }
      }

      if (testPhone) {
        const formattedPhone = formatPhoneNumber(testPhone);
        const message = `Hello Test User,

I hope you and your family had a wonderful Christmas and New Year break.

As we move into the new year and approach GCSEs and mock examinations, we would like to make you aware of a small update to our homework expectations. We will be placing a stronger emphasis on homework completion and will be monitoring this more closely. Our team will be following up with both students and parents to ensure that all homework set is completed by the assigned deadline.

This approach is designed to support consistency, reinforce learning, and ultimately give your child the best possible chance of success in their exams. To complete your homework please find the correct lesson on the calendar. Click on the lesson and you will find the homework button which will direct you to the correct page.

If you have any questions or would like to discuss this further, please do not hesitate to get in touch.

Kind regards,
Britney Lawrence`;

        const result = await sendWhatsAppMessage(formattedPhone, message);
        console.log(`Test WhatsApp ${result.success ? 'sent' : 'failed'} to ${testPhone}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Test messages sent", testEmail, testPhone }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send emails
    for (const contact of allContacts) {
      if (contact.email) {
        try {
          const html = await renderAsync(
            React.createElement(HomeworkPolicyEmail, {
              recipientName: contact.firstName,
              isParent: contact.isParent,
            })
          );

          await sendEmailWithRetry({
            from: "JB Tutors <enquiries@classbeyondacademy.io>",
            to: [contact.email],
            subject: "Important Update: GCSE Homework Expectations for 2026",
            html,
          });

          if (contact.isParent) {
            results.parentEmailsSent++;
          } else {
            results.studentEmailsSent++;
          }
          console.log(`Email sent to ${contact.email}`);
          await sleep(600); // Rate limiting
        } catch (error) {
          console.error(`Email failed for ${contact.email}:`, error);
          if (contact.isParent) {
            results.parentEmailsFailed++;
          } else {
            results.studentEmailsFailed++;
          }
        }
      }
    }

    // Send WhatsApp messages
    for (const contact of allContacts) {
      if (contact.phone) {
        const formattedPhone = formatPhoneNumber(contact.phone);
        
        const childReference = contact.isParent 
          ? "your child" 
          : "you";
        const theirReference = contact.isParent 
          ? "their" 
          : "your";
        const yourChildReference = contact.isParent
          ? "your child's"
          : "your";

        const message = `Hello ${contact.firstName},

I hope you and your family had a wonderful Christmas and New Year break.

As we move into the new year and approach GCSEs and mock examinations, we would like to make you aware of a small update to our homework expectations. We will be placing a stronger emphasis on homework completion and will be monitoring this more closely. Our team will be following up with both students and parents to ensure that all homework set is completed by the assigned deadline.

This approach is designed to support consistency, reinforce learning, and ultimately give ${childReference} the best possible chance of success in ${theirReference} exams. To complete ${yourChildReference} homework please find the correct lesson on the calendar. Click on the lesson and you will find the homework button which will direct you to the correct page.

If you have any questions or would like to discuss this further, please do not hesitate to get in touch.

Kind regards,
Britney Lawrence`;

        const result = await sendWhatsAppMessage(formattedPhone, message);
        
        if (result.success) {
          if (contact.isParent) {
            results.parentWhatsAppSent++;
          } else {
            results.studentWhatsAppSent++;
          }
          console.log(`WhatsApp sent to ${formattedPhone}`);
        } else {
          console.error(`WhatsApp failed for ${formattedPhone}:`, result.error);
          if (contact.isParent) {
            results.parentWhatsAppFailed++;
          } else {
            results.studentWhatsAppFailed++;
          }
        }
        await sleep(500); // Rate limiting for WhatsApp
      }
    }

    console.log("Campaign complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalEmailsSent: results.parentEmailsSent + results.studentEmailsSent,
          totalWhatsAppSent: results.parentWhatsAppSent + results.studentWhatsAppSent,
          totalParents: parentContacts.size,
          totalStudents: studentContacts.size,
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error("Error in send-gcse-homework-policy:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
