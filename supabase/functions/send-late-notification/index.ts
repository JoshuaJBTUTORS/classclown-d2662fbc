
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { LateNotificationEmail } from './_templates/late-notification-email.tsx';

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

    console.log(`Sending late notification for student ${studentName} in lesson ${lessonTitle}`);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get student and parent information
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('email, parent_first_name, parent_last_name')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Error fetching student data:', studentError);
      throw new Error('Student not found');
    }

    // Determine recipient email and name
    let recipientEmail = student.email;
    let recipientName = studentName;
    
    // If parent information exists, send to parent instead
    if (student.parent_first_name && student.parent_last_name) {
      recipientName = `${student.parent_first_name} ${student.parent_last_name}`;
      // Note: We're using student email as parent email since there's no separate parent email field
      // In a real implementation, you'd want a separate parent_email field
    }

    if (!recipientEmail) {
      throw new Error('No email address found for student or parent');
    }

    // Render the React Email template
    const html = await renderAsync(
      React.createElement(LateNotificationEmail, {
        studentName,
        recipientName,
        lessonTitle,
        lessonDate,
        lessonTime,
        tutorName,
      })
    );

    // Send the late notification email
    const emailResponse = await resend.emails.send({
      from: "JB Tutors <enquiries@jb-tutors.com>",
      to: [recipientEmail],
      subject: `${studentName} is running late for ${lessonTitle}`,
      html,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log("Late notification email sent successfully:", emailResponse);

    // Log the notification in the database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        email: recipientEmail,
        type: 'late_notification',
        subject: `${studentName} is running late for ${lessonTitle}`,
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
