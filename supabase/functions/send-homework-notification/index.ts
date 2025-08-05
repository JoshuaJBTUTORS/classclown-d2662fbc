
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Fetch homework details with lesson and student information
    const { data: homeworkData, error: homeworkError } = await supabase
      .from('homework')
      .select(`
        *,
        lessons!inner (
          id,
          title,
          tutor_id,
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

    // Process each student in the lesson
    for (const lessonStudent of homeworkData.lessons.lesson_students) {
      const student = lessonStudent.student;
      
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
          from: 'JB Tutors <enquiries@jb-tutors.com>',
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

      // Send email to parent if they exist and have an email
      if (student.parent && student.parent.email) {
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
          from: 'JB Tutors <enquiries@jb-tutors.com>',
          to: [student.parent.email],
          subject: `Homework Set for ${student.first_name} - ${homeworkData.title}`,
          html: parentHtml,
        });

        emailPromises.push(parentEmailPromise);

        // Create notification record for parent
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
    
    for (const student of homeworkData.lessons.lesson_students) {
      // Send WhatsApp to student if they have a phone number
      if (student.students.phone || student.students.whatsapp_number) {
        const phoneNumber = student.students.whatsapp_number || student.students.phone;
        const whatsappText = WhatsAppTemplates.homeworkNotification(
          student.students.first_name,
          student.students.first_name,
          homeworkData.title,
          dueDate
        );

        const whatsappPromise = whatsappService.sendMessage({
          phoneNumber: whatsappService.formatPhoneNumber(phoneNumber),
          text: whatsappText
        });
        whatsappPromises.push(whatsappPromise);
      }

      // Send WhatsApp to parent if they have a phone number
      if (student.students.parent && (student.students.parent.phone || student.students.parent.whatsapp_number)) {
        const phoneNumber = student.students.parent.whatsapp_number || student.students.parent.phone;
        const whatsappText = WhatsAppTemplates.homeworkNotification(
          `${student.students.parent.first_name} ${student.students.parent.last_name}`,
          student.students.first_name,
          homeworkData.title,
          dueDate
        );

        const whatsappPromise = whatsappService.sendMessage({
          phoneNumber: whatsappService.formatPhoneNumber(phoneNumber),
          text: whatsappText
        });
        whatsappPromises.push(whatsappPromise);
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Homework notifications sent successfully`,
        results: {
          successCount,
          failureCount,
          totalRecipients: emailPromises.length
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
