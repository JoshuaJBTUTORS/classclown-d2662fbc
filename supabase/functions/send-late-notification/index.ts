
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.5';

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

    // Send the late notification email
    const emailResponse = await resend.emails.send({
      from: "JB Tutors <enquiries@jb-tutors.com>",
      to: [recipientEmail],
      subject: `${studentName} is running late for ${lessonTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Student Late Notification</h2>
          
          <p>Dear ${recipientName},</p>
          
          <p>We wanted to inform you that <strong>${studentName}</strong> is running late for their scheduled lesson.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #343a40;">Lesson Details:</h3>
            <p><strong>Lesson:</strong> ${lessonTitle}</p>
            <p><strong>Date:</strong> ${lessonDate}</p>
            <p><strong>Time:</strong> ${lessonTime}</p>
            <p><strong>Tutor:</strong> ${tutorName}</p>
          </div>
          
          <p>Please ensure ${studentName} joins the lesson as soon as possible. If there are any issues or if ${studentName} will not be able to attend, please contact us immediately.</p>
          
          <p>Thank you for your attention to this matter.</p>
          
          <p>Best regards,<br>
          The JB Tutors Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #6c757d;">
            This is an automated notification. If you have any questions, please contact your tutor or our support team at enquiries@jb-tutors.com.
          </p>
        </div>
      `,
    });

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
