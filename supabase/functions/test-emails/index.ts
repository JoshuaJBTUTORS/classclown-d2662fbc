import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestEmailRequest {
  emailType: 'password-reset' | 'welcome' | 'lesson-reminder';
  testEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailType, testEmail }: TestEmailRequest = await req.json();
    
    console.log(`Sending test ${emailType} email to ${testEmail}`);

    let emailHtml = '';
    let subject = '';

    switch (emailType) {
      case 'password-reset':
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1fb86b;">Password Reset Request</h1>
            <p>Hello,</p>
            <p>We received a request to reset your Class Beyond password. This is a test email.</p>
            <div style="margin: 30px 0;">
              <a href="https://classbeyond.lovable.app/auth?tab=reset-password&token=test-token-123" 
                 style="background: #1fb86b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              Best regards,<br>
              The Class Beyond Team<br>
              📧 noreply@classbeyondacademy.io
            </p>
          </div>
        `;
        subject = 'Test: Reset Your Class Beyond Password';
        break;

      case 'welcome':
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1fb86b;">Welcome to Class Beyond!</h1>
            <p>Thank you for joining Class Beyond Academy. We're excited to have you on board!</p>
            <p>This is a test email to verify our email system is working correctly.</p>
            <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px;">
              <h3 style="margin-top: 0;">Getting Started</h3>
              <ul>
                <li>Complete your profile setup</li>
                <li>Browse available courses</li>
                <li>Start learning with Cleo AI</li>
              </ul>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              Best regards,<br>
              The Class Beyond Team<br>
              📧 enquiries@classbeyondacademy.io
            </p>
          </div>
        `;
        subject = 'Test: Welcome to Class Beyond!';
        break;

      case 'lesson-reminder':
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1fb86b;">Lesson Reminder</h1>
            <p>This is a test reminder email for your upcoming lesson.</p>
            <div style="margin: 30px 0; padding: 20px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #1fb86b;">
              <h3 style="margin-top: 0;">📚 Lesson Details</h3>
              <p><strong>Subject:</strong> GCSE Maths</p>
              <p><strong>Date:</strong> Tomorrow</p>
              <p><strong>Time:</strong> 3:00 PM - 4:00 PM</p>
              <p><strong>Tutor:</strong> Test Tutor</p>
            </div>
            <p>Please make sure you're ready 5 minutes before the lesson starts.</p>
            <p style="color: #666; font-size: 14px; margin-top: 40px;">
              Best regards,<br>
              The Class Beyond Team<br>
              📧 lessons@classbeyondacademy.io
            </p>
          </div>
        `;
        subject = 'Test: Lesson Reminder - GCSE Maths';
        break;

      default:
        throw new Error('Invalid email type');
    }

    const emailResponse = await resend.emails.send({
      from: 'Class Beyond <noreply@classbeyondacademy.io>',
      to: [testEmail],
      subject: subject,
      html: emailHtml,
    });

    console.log('Test email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test ${emailType} email sent to ${testEmail}`,
        emailId: emailResponse.data?.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send test email' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
