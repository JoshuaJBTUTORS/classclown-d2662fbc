import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { TrialBookingConfirmationEmail } from './_templates/trial-booking-confirmation-email.tsx'
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrialBookingConfirmationRequest {
  parentName: string;
  childName: string;
  email: string;
  subject: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  phone?: string;
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
      subject,
      preferredDate,
      preferredTime,
      message,
      phone,
    }: TrialBookingConfirmationRequest = await req.json();

    console.log('Sending trial booking confirmation email to:', email);

    const html = await renderAsync(
      React.createElement(TrialBookingConfirmationEmail, {
        parentName,
        childName,
        subject,
        preferredDate,
        preferredTime,
        message,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Class Beyond <enquiries@classbeyondacademy.io>",
      to: [email],
      subject: `Trial Lesson Request Received - ${childName}`,
      html,
    });

    console.log("Trial booking confirmation email sent successfully:", emailResponse);

    // Send WhatsApp message if phone number is available
    if (phone) {
      const whatsappText = WhatsAppTemplates.trialBookingConfirmation(
        parentName,
        childName,
        subject,
        preferredDate,
        preferredTime
      );

      const whatsappNumber = whatsappService.formatPhoneNumber(phone);
      const whatsappResponse = await whatsappService.sendMessage({
        phoneNumber: whatsappNumber,
        text: whatsappText
      });

      console.log("WhatsApp message result:", whatsappResponse);
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-trial-booking-confirmation function:", error);
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