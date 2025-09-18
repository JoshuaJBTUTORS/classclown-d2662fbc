import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReferralRequest {
  referrerName: string;
  referrerEmail: string;
  friendName: string;
  friendEmail: string;
  friendPhone: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Referral notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      referrerName, 
      referrerEmail, 
      friendName, 
      friendEmail, 
      friendPhone 
    }: ReferralRequest = await req.json();

    console.log("Processing referral:", { referrerName, referrerEmail, friendName, friendEmail });

    const emailSubject = `New Referral from ${referrerName} - £100 Referral Program`;
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
          New Friend Referral - £100 Program
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #007bff; margin-top: 0;">Referrer Information:</h3>
          <p><strong>Name:</strong> ${referrerName}</p>
          <p><strong>Email:</strong> ${referrerEmail}</p>
        </div>

        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">Referred Friend Information:</h3>
          <p><strong>Name:</strong> ${friendName}</p>
          <p><strong>Email:</strong> ${friendEmail}</p>
          <p><strong>Phone:</strong> ${friendPhone}</p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;"><strong>Action Required:</strong> Please follow up with ${friendName} about our tutoring services. Remember to track this referral for the £100 reward program.</p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #666; font-size: 14px;">
          <strong>Submitted on:</strong> ${new Date().toLocaleString('en-GB', { 
            timeZone: 'Europe/London',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    `;

    // Send email to both recipients
    const recipients = ['joshua@jb-tutors.com', 'britney@jb-tutors.com'];
    
    const emailPromises = recipients.map(recipient => 
      resend.emails.send({
        from: 'JB Tutors <noreply@jb-tutors.com>',
        to: [recipient],
        subject: emailSubject,
        html: emailHtml,
      })
    );

    const emailResults = await Promise.all(emailPromises);
    
    // Check if any emails failed
    const failedEmails = emailResults.filter(result => result.error);
    if (failedEmails.length > 0) {
      console.error("Some emails failed to send:", failedEmails);
      throw new Error("Failed to send some notification emails");
    }

    console.log("Referral notification emails sent successfully to:", recipients);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Referral notification sent successfully",
        emailsSent: recipients.length
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-referral-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send referral notification",
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);