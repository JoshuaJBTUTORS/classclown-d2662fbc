import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { TrialLessonApprovalEmail } from './_templates/trial-lesson-approval-email.tsx'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrialLessonApprovalRequest {
  parentName: string;
  childName: string;
  email: string;
  subject: string;
  lessonDate: string;
  lessonTime: string;
  studentLessonLink: string;
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
      lessonDate,
      lessonTime,
      studentLessonLink,
    }: TrialLessonApprovalRequest = await req.json();

    console.log('Sending trial lesson approval email to:', email);

    const html = await renderAsync(
      React.createElement(TrialLessonApprovalEmail, {
        parentName,
        childName,
        subject,
        lessonDate,
        lessonTime,
        studentLessonLink,
      })
    );

    const emailResponse = await resend.emails.send({
      from: "JB Tutors <enquiries@jb-tutors.com>",
      to: [email],
      subject: `Trial Lesson Confirmed - ${childName}`,
      html,
    });

    console.log("Trial lesson approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-trial-lesson-approval function:", error);
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