import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { WeekendLearningEmail } from './_templates/weekend-learning-email.tsx';

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

// WhatsApp service inline
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
    const { testMode = false, testEmail, testPhone, skipWhatsApp = false } = await req.json().catch(() => ({}));
    
    console.log(`Starting HeyCleo Weekend Learning campaign. Test mode: ${testMode}, Skip WhatsApp: ${skipWhatsApp}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query lessons for week of Jan 19-25, 2026
    const startDate = "2026-01-19T00:00:00Z";
    const endDate = "2026-01-26T00:00:00Z";

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
            whatsapp_number,
            parent_id,
            parents:parent_id (
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
            phone: student.whatsapp_number || student.phone || undefined,
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
              phone: parent.whatsapp_number || parent.phone || undefined,
              firstName: parent.first_name || 'Parent',
              isParent: true,
              studentName: `${student.first_name} ${student.last_name}`.trim(),
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
          React.createElement(WeekendLearningEmail, {
            recipientName: "Test User",
            isParent: true,
            studentName: "Test Student",
          })
        );

        try {
          await sendEmailWithRetry({
            from: "Class Beyond Academy <enquiries@classbeyondacademy.io>",
            to: [testEmail],
            subject: "Earn Additional Free Tuition with HeyCleo Weekend Learning",
            html,
          });
          console.log(`Test email sent to ${testEmail}`);
        } catch (error) {
          console.error(`Test email failed:`, error);
        }
      }

      if (testPhone && !skipWhatsApp) {
        const formattedPhone = formatPhoneNumber(testPhone);
        const message = `Dear Test User,

I hope you are well.

We are pleased to introduce a new opportunity for students at Class Beyond Academy to earn additional free tuition by completing structured weekend learning using our AI platform, HeyCleo.

All weekend learning will be overseen by Joshua, one of our Head Teachers, to ensure content remains fully aligned with GCSE exam boards.

How it works:
• Subscribe to HeyCleo
• Complete at least 2 lessons per day
• Do this for 7 consecutive days

Once completed, students will unlock access to additional free tuition alongside their current programme.

Get Started today: https://classclowncrm.com`;

        const result = await sendWhatsAppMessage(formattedPhone, message);
        console.log(`Test WhatsApp ${result.success ? 'sent' : 'failed'} to ${testPhone}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Test messages sent", 
          testEmail, 
          testPhone,
          contactsFound: {
            parents: parentContacts.size,
            students: studentContacts.size,
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send emails to all contacts
    for (const contact of allContacts) {
      if (contact.email) {
        try {
          const html = await renderAsync(
            React.createElement(WeekendLearningEmail, {
              recipientName: contact.firstName,
              isParent: contact.isParent,
              studentName: contact.studentName,
            })
          );

          await sendEmailWithRetry({
            from: "Class Beyond Academy <enquiries@classbeyondacademy.io>",
            to: [contact.email],
            subject: "Earn Additional Free Tuition with HeyCleo Weekend Learning",
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

    // Send WhatsApp messages (unless skipped)
    if (!skipWhatsApp) {
      for (const contact of allContacts) {
        if (contact.phone) {
          const formattedPhone = formatPhoneNumber(contact.phone);
          
          const childReference = contact.isParent 
            ? (contact.studentName || "your child") 
            : "you";
          const theirReference = contact.isParent 
            ? "their" 
            : "your";

          const message = `Dear ${contact.firstName},

I hope you are well.

We are pleased to introduce a new opportunity for ${contact.isParent ? 'your child' : 'you'} at Class Beyond Academy to earn additional free tuition by completing structured weekend learning using our AI platform, HeyCleo.

All weekend learning will be overseen by Joshua, one of our Head Teachers, to ensure content remains fully aligned with GCSE exam boards.

How it works:
• Subscribe to HeyCleo
• Complete at least 2 lessons per day
• Do this for 7 consecutive days

Once completed, ${childReference} will unlock access to additional free tuition alongside ${theirReference} current programme.

Get Started today: https://classclowncrm.com`;

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
    console.error("Error in send-heycleo-weekend-learning:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
