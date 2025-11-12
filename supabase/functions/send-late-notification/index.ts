
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { LateNotificationEmail } from './_templates/late-notification-email.tsx';
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LateNotificationRequest {
  lessonId: string;
  studentId: number;
  lessonTitle: string;
  lessonDate: string;
  lessonTime: string;
  studentName: string;
  tutorName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      lessonId, 
      studentId, 
      lessonTitle, 
      lessonDate, 
      lessonTime, 
      studentName, 
      tutorName 
    }: LateNotificationRequest = await req.json();

    console.log(`Sending late notification for student ${studentName} (ID: ${studentId}) in lesson ${lessonTitle}`);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get student and parent information with LEFT JOIN
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        email,
        parent_id,
        parents:parent_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error('Error fetching student data:', studentError);
      throw new Error(`Failed to fetch student data: ${studentError.message}`);
    }

    if (!studentData) {
      console.error('Student not found:', studentId);
      throw new Error('Student not found');
    }

    console.log('Student data retrieved:', {
      studentId: studentData.id,
      studentName: `${studentData.first_name} ${studentData.last_name}`,
      hasParent: !!studentData.parent_id,
      parentData: studentData.parents
    });

    // Determine recipient email and notification type
    let recipientEmail: string;
    let recipientName: string;
    let isParentNotification = false;

    if (studentData.parent_id && studentData.parents && studentData.parents.email) {
      // Send to parent
      recipientEmail = studentData.parents.email;
      recipientName = `${studentData.parents.first_name} ${studentData.parents.last_name}`;
      isParentNotification = true;
      console.log(`Sending notification to parent: ${recipientName} (${recipientEmail})`);
    } else if (studentData.email) {
      // Send to independent student
      recipientEmail = studentData.email;
      recipientName = `${studentData.first_name} ${studentData.last_name}`;
      isParentNotification = false;
      console.log(`Sending notification to independent student: ${recipientName} (${recipientEmail})`);
    } else {
      console.error('No valid email address found for student or parent');
      throw new Error('No email address found for student or parent');
    }

    // Render the React Email template with appropriate content
    const html = await renderAsync(
      React.createElement(LateNotificationEmail, {
        studentName,
        recipientName,
        lessonTitle,
        lessonDate,
        lessonTime,
        tutorName,
        isParentNotification,
      })
    );

    // Determine email subject based on recipient type
    const emailSubject = isParentNotification 
      ? `${studentName} is running late for ${lessonTitle}`
      : `You are running late for ${lessonTitle}`;

    // Send the late notification email
    const emailResponse = await resend.emails.send({
      from: "JB Tutors <enquiries@jb-tutors.com>",
      to: [recipientEmail],
      subject: emailSubject,
      html,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log("Late notification email sent successfully:", emailResponse);

    // Send WhatsApp message if phone number is available
    const phoneField = isParentNotification ? 'phone' : 'phone';
    const whatsappField = isParentNotification ? 'whatsapp_number' : 'whatsapp_number';
    const phoneNumber = studentData[whatsappField] || studentData[phoneField] || 
                       (isParentNotification && studentData.parentData ? 
                        studentData.parentData.whatsapp_number || studentData.parentData.phone : null);

    if (phoneNumber) {
      const whatsappText = WhatsAppTemplates.lateNotification(
        recipientName,
        studentName,
        lessonTitle
      );

      const whatsappNumber = whatsappService.formatPhoneNumber(phoneNumber);
      const whatsappResponse = await whatsappService.sendMessage({
        phoneNumber: whatsappNumber,
        text: whatsappText
      });

      console.log(`WhatsApp late notification to ${whatsappNumber}:`, whatsappResponse);
    }

    // Log the notification in the database with recipient type
    const notificationType = isParentNotification ? 'late_notification_parent' : 'late_notification_student';
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        email: recipientEmail,
        type: notificationType,
        subject: emailSubject,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error logging notification:', notificationError);
      // Don't throw here as the email was sent successfully
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Late notification sent successfully',
      recipient_type: isParentNotification ? 'parent' : 'student',
      recipient_email: recipientEmail,
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-late-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
