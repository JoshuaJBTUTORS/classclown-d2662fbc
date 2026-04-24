import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { ReviewRoomApprovalEmail } from './_templates/review-room-approval-email.tsx';
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReviewRoomApprovalRequest {
  parentName: string;
  childName: string;
  email: string;
  phone?: string;
  sessions: { date: string; time: string }[];
  studentLessonLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      parentName,
      childName,
      email,
      phone,
      sessions,
      studentLessonLink,
    }: ReviewRoomApprovalRequest = await req.json();

    if (!email || !sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log(`Sending review room approval to ${email} for ${sessions.length} session(s)`);

    const html = await renderAsync(
      React.createElement(ReviewRoomApprovalEmail, {
        parentName,
        childName,
        sessions,
        studentLessonLink,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "Class Beyond <enquiries@classbeyondacademy.io>",
      to: [email],
      subject: `You're in! ${childName}'s Review Room sessions confirmed 🎉`,
      html,
    });

    console.log("Review room approval email sent:", emailResponse);

    let whatsappResult: any = null;
    if (phone) {
      try {
        const whatsappText = WhatsAppTemplates.reviewRoomApproval(
          parentName,
          childName,
          sessions,
          studentLessonLink,
        );
        const whatsappNumber = whatsappService.formatPhoneNumber(phone);
        whatsappResult = await whatsappService.sendMessage({
          phoneNumber: whatsappNumber,
          text: whatsappText,
        });
        console.log("WhatsApp send result:", whatsappResult);
      } catch (waErr) {
        console.error("WhatsApp send failed (continuing):", waErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, email: emailResponse, whatsapp: whatsappResult }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-review-room-approval:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
