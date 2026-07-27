
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { HomeworkNotificationEmail } from "./_templates/homework-notification-email.tsx";
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HomeworkNotificationRequest {
  homeworkId: string;
}

// Generate HMAC token for HeyCleo cross-platform authentication
async function generateCrossPlatformToken(email: string, secret: string): Promise<string> {
  const timestamp = Date.now();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(`${email}:${timestamp}`);
  
  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return btoa(JSON.stringify({ email, timestamp, signature: signatureHex }));
}

// Send homework to HeyCleo platform
async function sendHomeworkToHeyCleo(
  tutorEmail: string,
  studentEmails: string[],
  homework: {
    title: string;
    description?: string;
    attachmentUrl?: string;
    additionalResourcesUrl?: string;
    dueDate?: string;
    subject?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const crossPlatformSecret = Deno.env.get('HEYCLEO_CROSS_PLATFORM_SECRET');
  
  if (!crossPlatformSecret) {
    console.warn('HEYCLEO_CROSS_PLATFORM_SECRET not configured, skipping HeyCleo sync');
    return { success: false, error: 'Secret not configured' };
  }

  if (studentEmails.length === 0) {
    console.log('No student emails to sync to HeyCleo');
    return { success: true };
  }

  try {
    const token = await generateCrossPlatformToken(tutorEmail, crossPlatformSecret);
    
    const payload = {
      token,
      tutorEmail,
      studentEmails,
      pdfUrl: homework.attachmentUrl || null,
      additionalPdfUrl: homework.additionalResourcesUrl || null,
      title: homework.title,
      description: homework.description || null,
      subject: homework.subject || null,
      dueDate: homework.dueDate || null,
    };

    console.log(`Sending homework to HeyCleo for ${studentEmails.length} students`);

    const response = await fetch('https://vfhftrmneaizgdvngfwe.supabase.co/functions/v1/receive-homework-from-crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HeyCleo webhook failed: ${response.status} - ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log('HeyCleo webhook response:', result);
    return { success: true };
  } catch (error) {
    console.error('Error sending homework to HeyCleo:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { homeworkId }: HomeworkNotificationRequest = await req.json();

    if (!homeworkId) {
      return new Response(
        JSON.stringify({ error: "Missing homework ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching homework details for ID: ${homeworkId}`);

    // Fetch homework details with lesson, tutor, and student information
    const { data: homeworkData, error: homeworkError } = await supabase
      .from('homework')
      .select(`
        *,
        lessons!inner (
          id,
          title,
          subject,
          tutor_id,
          tutors (
            id,
            email,
            first_name,
            last_name
          ),
          lesson_students (
            student:students (
              id,
              first_name,
              last_name,
              email,
              user_id,
              parent:parents (
                id,
                first_name,
                last_name,
                email,
                user_id
              )
            )
          )
        )
      `)
      .eq('id', homeworkId)
      .single();

    if (homeworkError) {
      console.error('Error fetching homework:', homeworkError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch homework details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Homework data fetched successfully');

    const platformUrl = "https://classclowncrm.com/";
    const dueDate = homeworkData.due_date ? new Date(homeworkData.due_date).toLocaleDateString() : undefined;

    const emailPromises = [];
    const notificationPromises = [];

    // Collect emails for HeyCleo (both student and parent)
    const heyCleoEmails: string[] = [];

    // Process each student in the lesson
    for (const lessonStudent of homeworkData.lessons.lesson_students) {
      const student = lessonStudent.student;
      
      // Collect student email for HeyCleo sync
      if (student.email) {
        heyCleoEmails.push(student.email);
      }
      
      // Also collect parent email for HeyCleo sync (if different from student)
      if (student.parent?.email && student.parent.email !== student.email) {
        heyCleoEmails.push(student.parent.email);
      }
      
      // Send email to student if they have an email
      if (student.email) {
        console.log(`Preparing email for student: ${student.first_name} ${student.last_name}`);
        
        const studentHtml = await renderAsync(
          React.createElement(HomeworkNotificationEmail, {
            recipientName: student.first_name,
            studentName: student.first_name,
            homeworkTitle: homeworkData.title,
            lessonTitle: homeworkData.lessons.title,
            dueDate,
            platformUrl,
            isParent: false,
          })
        );

        const studentEmailPromise = resend.emails.send({
          from: 'Class Beyond <enquiries@classbeyondacademy.io>',
          to: [student.email],
          subject: `New Homework Set - ${homeworkData.title}`,
          html: studentHtml,
        });

        emailPromises.push(studentEmailPromise);

        // Create notification record for student
        if (student.user_id) {
          const studentNotificationPromise = supabase
            .from('notifications')
            .insert({
              user_id: student.user_id,
              type: 'homework_assigned',
              email: student.email,
              subject: `New Homework Set - ${homeworkData.title}`,
              status: 'pending'
            });

          notificationPromises.push(studentNotificationPromise);
        }
      }

      // Parent email notifications temporarily disabled (kept in code, disconnected)
      if (false && student.parent && student.parent.email) {
        console.log(`Preparing email for parent: ${student.parent.first_name} ${student.parent.last_name}`);
        
        const parentHtml = await renderAsync(
          React.createElement(HomeworkNotificationEmail, {
            recipientName: student.parent.first_name,
            studentName: student.first_name,
            homeworkTitle: homeworkData.title,
            lessonTitle: homeworkData.lessons.title,
            dueDate,
            platformUrl,
            isParent: true,
          })
        );

        const parentEmailPromise = resend.emails.send({
          from: 'Class Beyond <enquiries@classbeyondacademy.io>',
          to: [student.parent.email],
          subject: `Homework Set for ${student.first_name} - ${homeworkData.title}`,
          html: parentHtml,
        });

        emailPromises.push(parentEmailPromise);

        if (student.parent.user_id) {
          const parentNotificationPromise = supabase
            .from('notifications')
            .insert({
              user_id: student.parent.user_id,
              type: 'homework_assigned',
              email: student.parent.email,
              subject: `Homework Set for ${student.first_name} - ${homeworkData.title}`,
              status: 'pending'
            });

          notificationPromises.push(parentNotificationPromise);
        }
      } else if (student.parent && student.parent.email) {
        console.log(`Parent email skipped (disabled) for ${student.parent.email}`);
      }
    }

    console.log(`Sending ${emailPromises.length} emails`);

    // Send all emails and create notifications
    const [emailResults, notificationResults] = await Promise.allSettled([
      Promise.allSettled(emailPromises),
      Promise.allSettled(notificationPromises)
    ]);

    let successCount = 0;
    let failureCount = 0;

    // Send WhatsApp messages after emails are processed
    const whatsappPromises = [];
    
    for (const lessonStudent of homeworkData.lessons.lesson_students) {
      const student = lessonStudent.student;
      if (!student) continue;
      
      // Send WhatsApp to student if they have a phone number
      if (student.phone || student.whatsapp_number) {
        const phoneNumber = student.whatsapp_number || student.phone;
        const whatsappText = WhatsAppTemplates.homeworkNotification(
          student.first_name,
          student.first_name,
          homeworkData.title,
          dueDate
        );

        const whatsappPromise = whatsappService.sendMessage({
          phoneNumber: whatsappService.formatPhoneNumber(phoneNumber),
          text: whatsappText
        });
        whatsappPromises.push(whatsappPromise);
      }

      // Parent WhatsApp notifications temporarily disabled (kept in code, disconnected)
      if (false && student.parent && (student.parent.phone || student.parent.whatsapp_number)) {
        const phoneNumber = student.parent.whatsapp_number || student.parent.phone;
        const whatsappText = WhatsAppTemplates.homeworkNotification(
          `${student.parent.first_name} ${student.parent.last_name}`,
          student.first_name,
          homeworkData.title,
          dueDate
        );

        const whatsappPromise = whatsappService.sendMessage({
          phoneNumber: whatsappService.formatPhoneNumber(phoneNumber),
          text: whatsappText
        });
        whatsappPromises.push(whatsappPromise);
      } else if (student.parent && (student.parent.phone || student.parent.whatsapp_number)) {
        console.log(`Parent WhatsApp skipped (disabled) for ${student.parent.first_name}`);
      }
    }

    // Send all WhatsApp messages
    if (whatsappPromises.length > 0) {
      const whatsappResults = await Promise.allSettled(whatsappPromises);
      console.log(`WhatsApp messages sent: ${whatsappResults.filter(r => r.status === 'fulfilled').length}/${whatsappResults.length}`);
    }

    // Process email results
    if (emailResults.status === 'fulfilled') {
      emailResults.value.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          console.log(`Email ${index + 1} sent successfully`);
        } else {
          failureCount++;
          console.error(`Email ${index + 1} failed:`, result.reason);
        }
      });
    }

    // Process notification results
    if (notificationResults.status === 'fulfilled') {
      notificationResults.value.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Notification ${index + 1} failed:`, result.reason);
        }
      });
    }

    console.log(`Email sending complete: ${successCount} successful, ${failureCount} failed`);

    // Per-lesson HeyCleo sync is disabled. Weekly aggregate sync handles this now.
    const heyCleoResult = { success: false, error: 'disabled' };
    console.log('HeyCleo sync disabled (per-lesson sync silenced)');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Homework notifications sent successfully`,
        results: {
          successCount,
          failureCount,
          totalRecipients: emailPromises.length,
          heyCleoSync: heyCleoResult.success
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-homework-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
