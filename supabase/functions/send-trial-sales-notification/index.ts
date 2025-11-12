import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { TrialSalesNotificationEmail } from './_templates/trial-sales-notification-email.tsx'
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

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

    // Send WhatsApp notification to sales team
    const salesWhatsappNumbers = ["+447413069120"]; // Add your sales team numbers here
    
    for (const salesNumber of salesWhatsappNumbers) {
      const whatsappText = WhatsAppTemplates.trialSalesNotification(
        parentName,
        childName,
        email,
        phone || "Not provided",
        subject,
        preferredDate,
        preferredTime,
        message || "No additional message",
        bookingId
      );

      const whatsappResponse = await whatsappService.sendMessage({
        phoneNumber: salesNumber,
        text: whatsappText
      });

      console.log(`WhatsApp sales notification to ${salesNumber}:`, whatsappResponse);
    }

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