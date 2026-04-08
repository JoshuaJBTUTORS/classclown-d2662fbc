import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { EnrollmentUpdateEmail } from "./_templates/enrollment-update-email.tsx";
import { whatsappService } from '../_shared/whatsapp-service.ts';
import { WhatsAppTemplates } from '../_shared/whatsapp-templates.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { studentIds, action } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or empty studentIds array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!action || !['added', 'removed'].includes(action)) {
      return new Response(
        JSON.stringify({ error: "action must be 'added' or 'removed'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing enrollment notification for ${studentIds.length} students (${action})`);

    const results = [];

    for (const studentId of studentIds) {
      try {
        // Get student with parent info
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id, first_name, last_name, email, phone, whatsapp_number, parent_id')
          .eq('id', studentId)
          .single();

        if (studentError || !student) {
          console.error(`Student ${studentId} not found:`, studentError);
          results.push({ studentId, success: false, error: 'Student not found' });
          continue;
        }

        let parentEmail: string | null = null;
        let parentPhone: string | null = null;
        let parentName = 'Parent';
        const childName = `${student.first_name} ${student.last_name}`;

        // Get parent info if parent_id exists
        if (student.parent_id) {
          const { data: parent } = await supabase
            .from('parents')
            .select('first_name, last_name, email, phone, whatsapp_number')
            .eq('id', student.parent_id)
            .single();

          if (parent) {
            parentEmail = parent.email;
            parentPhone = parent.whatsapp_number || parent.phone;
            parentName = `${parent.first_name} ${parent.last_name}`;
          }
        }

        // Fallback to student's own email/phone
        const recipientEmail = parentEmail || student.email;
        const recipientPhone = parentPhone || student.whatsapp_number || student.phone;
        const recipientName = student.parent_id ? parentName : `${student.first_name}`;

        // Send email
        if (recipientEmail) {
          try {
            const html = await renderAsync(
              React.createElement(EnrollmentUpdateEmail, {
                recipientName,
                childName,
                action,
              })
            );

            await resend.emails.send({
              from: 'Class Beyond <enquiries@classbeyondacademy.io>',
              to: [recipientEmail],
              subject: 'Lesson Schedule Update - Class Beyond',
              html,
            });

            console.log(`Email sent to ${recipientEmail} for student ${studentId}`);
          } catch (emailErr) {
            console.error(`Failed to send email to ${recipientEmail}:`, emailErr);
          }
        }

        // Send WhatsApp
        if (recipientPhone) {
          try {
            const whatsappText = WhatsAppTemplates.enrollmentUpdate(recipientName, childName);
            const formattedPhone = whatsappService.formatPhoneNumber(recipientPhone);

            const whatsappResult = await whatsappService.sendMessage({
              phoneNumber: formattedPhone,
              text: whatsappText,
            });

            console.log(`WhatsApp sent to ${formattedPhone}:`, whatsappResult);
          } catch (waErr) {
            console.error(`Failed to send WhatsApp to ${recipientPhone}:`, waErr);
          }
        }

        results.push({ studentId, success: true });
      } catch (err) {
        console.error(`Error processing student ${studentId}:`, err);
        results.push({ studentId, success: false, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-enrollment-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
