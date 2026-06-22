import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * HeyCleo Overdue Homework Reminder Webhook
 * 
 * Expected Payload from HeyCleo:
 * {
 *   secret: string;           // Must match HEYCLEO_CROSS_PLATFORM_SECRET
 *   student_name: string;     // Student's name
 *   student_email: string;    // Student's email
 *   homework_title: string;   // Title of the overdue homework
 * }
 */

interface OverdueHomeworkPayload {
  secret: string;
  student_name: string;
  student_email: string;
  homework_title: string;
}

const WhatsAppTemplates = {
  overdueHomeworkReminder: (
    recipientName: string,
    studentName: string,
    homeworkTitle: string,
    isStudent: boolean
  ) => `
⚠️ Homework Overdue!

Hi ${recipientName}!

${isStudent ? 'Your' : `${studentName}'s`} homework is now overdue:

📚 ${homeworkTitle}

Please complete this as soon as possible via the Learning Hub.

🔗 Login here: https://classclowncrm.com/learning-hub

If you're having any difficulties, contact your tutor for support.

Best regards,
Class Beyond Team 🎯
`.trim(),
};

function generateOverdueEmailHtml(
  recipientName: string,
  studentName: string,
  homeworkTitle: string,
  isStudent: boolean
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Homework Overdue - Action Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with urgent styling -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ⚠️ Homework Overdue
              </h1>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${recipientName},
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                ${isStudent ? 'Your' : `${studentName}'s`} homework is now <strong style="color: #dc2626;">overdue</strong> and requires immediate attention:
              </p>
              
              <!-- Homework details box -->
              <table role="presentation" style="width: 100%; margin: 25px 0; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 8px 8px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      OVERDUE HOMEWORK
                    </p>
                    <p style="margin: 8px 0 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                      📚 ${homeworkTitle}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 25px; color: #374151; font-size: 16px; line-height: 1.6;">
                Please complete this assignment as soon as possible via the Learning Hub.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="https://classclowncrm.com/learning-hub" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Go to Learning Hub →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 25px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you're having any difficulties with this homework, please contact your tutor for support.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                Best regards,<br>
                <strong style="color: #374151;">Class Beyond Team</strong> 🎯
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const wazzupApiKey = Deno.env.get("WAZZUP_API_KEY");
  const wazzupChannelId = Deno.env.get("WAZZUP_CHANNEL_ID");

  if (!wazzupApiKey || !wazzupChannelId) {
    console.log("WhatsApp credentials not configured, skipping");
    return false;
  }

  // Format phone number
  let formattedPhone = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  if (formattedPhone.startsWith("0")) {
    formattedPhone = "44" + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith("+")) {
    formattedPhone = formattedPhone.substring(1);
  }

  try {
    const response = await fetch("https://api.wazzup24.com/v3/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${wazzupApiKey}`,
      },
      body: JSON.stringify({
        channelId: wazzupChannelId,
        chatType: "whatsapp",
        chatId: formattedPhone,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp API error:", response.status, errorText);
      return false;
    }

    console.log("WhatsApp message sent to:", formattedPhone);
    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ============================================================
  // HOMEWORK REMINDERS DISABLED
  // All overdue homework reminder delivery (email + WhatsApp) has been
  // turned off. We still accept the webhook so HeyCleo's side doesn't
  // error, but we short-circuit before sending anything.
  // To re-enable: remove this block.
  // ============================================================
  console.log("Homework reminders are disabled — ignoring incoming webhook.");
  return new Response(
    JSON.stringify({
      success: true,
      message: "Homework reminders are currently disabled",
      delivered: false,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );

  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      console.error("Method not allowed:", req.method);
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const raw = await req.json();
    console.log("Received overdue homework webhook:", {
      keys: Object.keys(raw),
      student_email: raw.student_email || raw.studentEmail,
      student_name: raw.student_name || raw.studentName,
      homework_title: raw.homework_title || raw.homeworkTitle,
    });

    // Normalize payload (support snake_case and camelCase)
    const payload: OverdueHomeworkPayload = {
      secret: raw.secret || req.headers.get("x-heycleo-secret") || req.headers.get("x-webhook-secret") || "",
      student_name: (raw.student_name || raw.studentName || "").trim(),
      student_email: (raw.student_email || raw.studentEmail || "").trim().toLowerCase(),
      homework_title: (raw.homework_title || raw.homeworkTitle || "").trim(),
    };

    // Validate the shared secret
    const sharedSecret = Deno.env.get("HEYCLEO_CROSS_PLATFORM_SECRET");
    if (!sharedSecret) {
      console.error("HEYCLEO_CROSS_PLATFORM_SECRET not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payload.secret !== sharedSecret) {
      console.error("Invalid secret provided");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const missing: string[] = [];
    if (!payload.student_name) missing.push("student_name");
    if (!payload.student_email) missing.push("student_email");
    if (!payload.homework_title) missing.push("homework_title");

    if (missing.length) {
      console.error("Missing required fields:", missing);
      return new Response(
        JSON.stringify({ success: false, error: `Missing required fields: ${missing.join(", ")}`, missing }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // ============================================================
    // Resolve recipients by walking: homework -> lesson -> students -> parents
    // The payload's student_email is often the Learning Hub login (parent's email),
    // so we don't trust it as a primary key. Instead, find the homework by title
    // and load every student enrolled in that lesson with their parent contacts.
    // ============================================================

    type StudentRow = {
      id: number;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      parent_id: string | null;
      parents?: {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone: string | null;
      } | null;
    };

    type ResolvedRecipient = {
      student: StudentRow;
      parent: { id: string; first_name: string; last_name: string; email: string; phone: string } | null;
    };

    const buildRecipient = (s: StudentRow): ResolvedRecipient => ({
      student: s,
      parent: s.parents
        ? {
            id: s.parents.id,
            first_name: s.parents.first_name || "",
            last_name: s.parents.last_name || "",
            email: s.parents.email || "",
            phone: s.parents.phone || "",
          }
        : null,
    });

    let recipients: ResolvedRecipient[] = [];
    let resolutionPath = "unresolved";
    let ambiguousMatch = false;

    // STEP 1: Find the most recent homework matching the title
    const { data: homeworkRow } = await supabase
      .from("homework")
      .select("id, title, lesson_id, created_at")
      .ilike("title", payload.homework_title)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (homeworkRow?.lesson_id) {
      console.log("Found homework:", homeworkRow.id, "→ lesson:", homeworkRow.lesson_id);

      // STEP 2: Load every student enrolled in that lesson + their parent
      const { data: lessonStudents, error: lsError } = await supabase
        .from("lesson_students")
        .select(`
          student:students (
            id, first_name, last_name, email, phone, parent_id,
            parents:parents!students_parent_id_fkey (
              id, first_name, last_name, email, phone
            )
          )
        `)
        .eq("lesson_id", homeworkRow.lesson_id);

      if (lsError) {
        console.error("Failed to load lesson_students:", lsError);
      }

      const enrolled: StudentRow[] = (lessonStudents || [])
        .map((row: any) => row.student)
        .filter((s: any): s is StudentRow => !!s);

      console.log(`Lesson has ${enrolled.length} enrolled student(s)`);

      if (enrolled.length > 0) {
        // STEP 3: Pick the right student using payload hints
        const payloadEmail = payload.student_email.toLowerCase();
        const payloadName = payload.student_name.toLowerCase().trim();

        // 3a) Match by student email OR parent email
        let match = enrolled.find(
          (s) =>
            (s.email && s.email.toLowerCase() === payloadEmail) ||
            (s.parents?.email && s.parents.email.toLowerCase() === payloadEmail)
        );

        if (match) {
          resolutionPath = "matched_by_email";
        } else {
          // 3b) Match by student full name
          match = enrolled.find((s) => {
            const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase().trim();
            return fullName === payloadName || (payloadName && fullName.includes(payloadName));
          });
          if (match) resolutionPath = "matched_by_name";
        }

        // 3c) Single-student lesson — unambiguous
        if (!match && enrolled.length === 1) {
          match = enrolled[0];
          resolutionPath = "single_student_lesson";
        }

        if (match) {
          recipients = [buildRecipient(match)];
          console.log(
            `Resolved via lesson enrolment (${resolutionPath}): ${match.first_name} ${match.last_name} (id=${match.id})`
          );
        } else {
          // 3d) Ambiguous — notify ALL parents on the lesson rather than dropping the reminder
          ambiguousMatch = true;
          resolutionPath = "ambiguous_fanout";
          recipients = enrolled.map(buildRecipient);
          console.warn(
            `Ambiguous match for "${payload.student_name}" <${payload.student_email}> on lesson ${homeworkRow.lesson_id}. Fanning out to ${recipients.length} families.`
          );
        }
      }
    } else {
      console.log("No homework row matched title:", payload.homework_title);
    }

    // STEP 4: Fallback — old email-based lookup against students AND parents
    if (recipients.length === 0) {
      console.log("Falling back to email-based lookup for:", payload.student_email);

      const { data: studentByEmail } = await supabase
        .from("students")
        .select(`
          id, first_name, last_name, email, phone, parent_id,
          parents:parents!students_parent_id_fkey (
            id, first_name, last_name, email, phone
          )
        `)
        .eq("email", payload.student_email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (studentByEmail) {
        recipients = [buildRecipient(studentByEmail as StudentRow)];
        resolutionPath = "fallback_student_email";
        console.log("Resolved via fallback student email:", studentByEmail.id);
      } else {
        // Try parent email → load all their children
        const { data: parentByEmail } = await supabase
          .from("parents")
          .select("id, first_name, last_name, email, phone")
          .eq("email", payload.student_email)
          .maybeSingle();

        if (parentByEmail) {
          const { data: kids } = await supabase
            .from("students")
            .select("id, first_name, last_name, email, phone, parent_id")
            .eq("parent_id", parentByEmail.id);

          if (kids && kids.length > 0) {
            const payloadName = payload.student_name.toLowerCase().trim();
            const namedChild = kids.find((k) => {
              const fn = `${k.first_name || ""} ${k.last_name || ""}`.toLowerCase().trim();
              return fn === payloadName || (payloadName && fn.includes(payloadName));
            });
            const chosen = namedChild || (kids.length === 1 ? kids[0] : null);
            if (chosen) {
              recipients = [
                buildRecipient({ ...(chosen as StudentRow), parents: parentByEmail as any }),
              ];
              resolutionPath = "fallback_parent_email";
              console.log(
                `Resolved via fallback parent email → child ${chosen.first_name} ${chosen.last_name}`
              );
            } else {
              ambiguousMatch = true;
              resolutionPath = "fallback_parent_fanout";
              recipients = kids.map((k) =>
                buildRecipient({ ...(k as StudentRow), parents: parentByEmail as any })
              );
              console.warn(
                `Parent ${parentByEmail.email} has ${kids.length} children — fanning out reminders.`
              );
            }
          }
        }
      }
    }

    if (recipients.length === 0) {
      console.error(
        "Could not resolve any recipient for:",
        payload.student_email,
        payload.student_name,
        payload.homework_title
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Recipient not found",
          details: `No student or parent could be matched for email '${payload.student_email}' / homework '${payload.homework_title}'`,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the first recipient as the "primary" for the existing send blocks below.
    // (Ambiguous fan-out is handled in a loop after the primary send.)
    const primary = recipients[0];
    const student = primary.student as any;
    const parent = primary.parent;

    // Track what notifications were sent
    const notificationsSent = {
      student_email: false,
      student_whatsapp: false,
      parent_email: false,
      parent_whatsapp: false,
    };

    const studentName = payload.student_name || `${student.first_name} ${student.last_name}`;

    // Send student WhatsApp
    if (student.phone) {
      const studentMessage = WhatsAppTemplates.overdueHomeworkReminder(
        student.first_name,
        studentName,
        payload.homework_title,
        true
      );
      notificationsSent.student_whatsapp = await sendWhatsAppMessage(student.phone, studentMessage);
    }

    // Send parent WhatsApp
    if (parent?.phone) {
      const parentMessage = WhatsAppTemplates.overdueHomeworkReminder(
        parent.first_name,
        studentName,
        payload.homework_title,
        false
      );
      notificationsSent.parent_whatsapp = await sendWhatsAppMessage(parent.phone, parentMessage);
    }

    // Send student email
    if (resend && student.email) {
      try {
        const studentEmailHtml = generateOverdueEmailHtml(
          student.first_name,
          studentName,
          payload.homework_title,
          true
        );
        await resend.emails.send({
          from: "Class Beyond <notifications@classbeyond.online>",
          to: [student.email],
          subject: `⚠️ Homework Overdue: ${payload.homework_title}`,
          html: studentEmailHtml,
        });
        notificationsSent.student_email = true;
        console.log("Student email sent to:", student.email);
      } catch (emailError) {
        console.error("Failed to send student email:", emailError);
      }
    }

    // Send parent email
    if (resend && parent?.email) {
      try {
        const parentEmailHtml = generateOverdueEmailHtml(
          parent.first_name,
          studentName,
          payload.homework_title,
          false
        );
        await resend.emails.send({
          from: "Class Beyond <notifications@classbeyond.online>",
          to: [parent.email],
          subject: `⚠️ Homework Overdue: ${payload.homework_title} - ${studentName}`,
          html: parentEmailHtml,
        });
        notificationsSent.parent_email = true;
        console.log("Parent email sent to:", parent.email);
      } catch (emailError) {
        console.error("Failed to send parent email:", emailError);
      }
    }

    // ============================================================
    // Fan-out: if more than one recipient was resolved (ambiguous match),
    // send the same overdue reminder to every additional family on the lesson.
    // ============================================================
    const extraSends: Array<Record<string, unknown>> = [];
    for (let i = 1; i < recipients.length; i++) {
      const r = recipients[i];
      const sName = `${r.student.first_name || ""} ${r.student.last_name || ""}`.trim();
      const sent = { student_email: false, student_whatsapp: false, parent_email: false, parent_whatsapp: false };

      if (r.student.phone) {
        sent.student_whatsapp = await sendWhatsAppMessage(
          r.student.phone,
          WhatsAppTemplates.overdueHomeworkReminder(r.student.first_name || "", sName, payload.homework_title, true)
        );
      }
      if (r.parent?.phone) {
        sent.parent_whatsapp = await sendWhatsAppMessage(
          r.parent.phone,
          WhatsAppTemplates.overdueHomeworkReminder(r.parent.first_name, sName, payload.homework_title, false)
        );
      }
      if (resend && r.student.email) {
        try {
          await resend.emails.send({
            from: "Class Beyond <notifications@classbeyond.online>",
            to: [r.student.email],
            subject: `⚠️ Homework Overdue: ${payload.homework_title}`,
            html: generateOverdueEmailHtml(r.student.first_name || "", sName, payload.homework_title, true),
          });
          sent.student_email = true;
        } catch (e) { console.error("Fan-out student email failed:", e); }
      }
      if (resend && r.parent?.email) {
        try {
          await resend.emails.send({
            from: "Class Beyond <notifications@classbeyond.online>",
            to: [r.parent.email],
            subject: `⚠️ Homework Overdue: ${payload.homework_title} - ${sName}`,
            html: generateOverdueEmailHtml(r.parent.first_name, sName, payload.homework_title, false),
          });
          sent.parent_email = true;
        } catch (e) { console.error("Fan-out parent email failed:", e); }
      }
      extraSends.push({ student_id: r.student.id, student_name: sName, sent });
    }

    // Log notification in the notifications table
    const notificationCount = Object.values(notificationsSent).filter(Boolean).length
      + extraSends.reduce((acc, e: any) => acc + Object.values(e.sent).filter(Boolean).length, 0);
    if (notificationCount > 0) {
      await supabase.from("notifications").insert({
        type: "homework_overdue",
        subject: `Overdue homework reminder: ${payload.homework_title}`,
        email: student.email || parent?.email || payload.student_email,
        status: "sent",
        metadata: {
          student_id: student.id,
          student_name: studentName,
          homework_title: payload.homework_title,
          notifications_sent: notificationsSent,
          resolution_path: resolutionPath,
          ambiguous_match: ambiguousMatch,
          fanout_recipients: extraSends,
        },
      });
    }

    console.log("Overdue reminder complete:", { resolutionPath, ambiguousMatch, primary: notificationsSent, extras: extraSends.length });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Overdue reminder sent",
        notifications_sent: notificationsSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
