import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { TrialSalesNotificationEmail } from './_templates/trial-sales-notification-email.tsx'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrialSalesNotificationRequest {
  parentName: string;
  childName: string;
  email: string;
  phone?: string;
  subject: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  bookingId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      parentName,
      childName,
      email,
      phone,
      subject,
      preferredDate,
      preferredTime,
      message,
      bookingId,
    }: TrialSalesNotificationRequest = await req.json();

    console.log('Sending trial sales notification email for booking:', bookingId);

    const html = await renderAsync(
      React.createElement(TrialSalesNotificationEmail, {
        parentName,
        childName,
        email,
        phone,
        subject,
        preferredDate,
        preferredTime,
        message,
        bookingId,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "JB Tutors <enquiries@jb-tutors.com>",
      to: ["joshua@jb-tutors.com", "musa@jb-tutors.com"],
      subject: `New Trial Booking - ${childName} - ${subject}`,
      html,
    });

    console.log("Trial sales notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-trial-sales-notification function:", error);
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