import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { TutorScheduleUpdateEmail } from "./_templates/tutor-schedule-update-email.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Quiet period: a tutor is only emailed once no further change has been
// queued for them in the last 30 minutes.
const COOLDOWN_MINUTES = 30;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    let dryRun = false;
    let tutorId: string | null = null;
    try {
      const body = await req.json();
      dryRun = body?.dryRun === true;
      tutorId = typeof body?.tutorId === "string" ? body.tutorId : null;
    } catch (_e) {
      // Invalid or missing JSON is handled by validation below.
    }

    if (!tutorId || !UUID_PATTERN.test(tutorId)) {
      return new Response(
        JSON.stringify({ error: "A valid tutorId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: pending, error: pendingError } = await supabase
      .from("tutor_schedule_notifications")
      .select("id, tutor_id, change_type, queued_at")
      .eq("tutor_id", tutorId)
      .is("sent_at", null)
      .order("queued_at", { ascending: true })
      .limit(1000);

    if (pendingError) throw pendingError;

    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ success: true, dryRun, processed: 0, message: "Nothing queued" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cutoff = Date.now() - COOLDOWN_MINUTES * 60 * 1000;
    const readyRows = pending.filter((row) => new Date(row.queued_at).getTime() <= cutoff);
    const waiting = pending.length - readyRows.length;

    if (readyRows.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          dryRun,
          sent: 0,
          waiting,
          message: "All queued tutors are still inside the cool down window",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: tutors, error: tutorsError } = await supabase
      .from("tutors")
      .select("id, first_name, last_name, email")
      .eq("id", tutorId)
      .limit(1);

    if (tutorsError) throw tutorsError;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;
    const tutor = tutors?.[0];
    const tutorName = tutor?.first_name || "there";
    const email = tutor?.email || null;
    const ids = readyRows.map((row) => row.id);
    const added = readyRows.filter((row) => row.change_type === "added").length;
    const removed = readyRows.filter((row) => row.change_type === "removed").length;

    if (!email) {
      console.log(`Tutor ${tutorId} has no email on file, marking queue rows as handled`);
      if (!dryRun) {
        await supabase
          .from("tutor_schedule_notifications")
          .update({ sent_at: new Date().toISOString() })
          .in("id", ids);
      }
      return new Response(
        JSON.stringify({ success: true, dryRun, tutorId, skipped: "no email", changes: ids.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({ success: true, dryRun, tutorId, email, added, removed, changes: ids.length, waiting, wouldSend: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await renderAsync(
      React.createElement(TutorScheduleUpdateEmail, {
        tutorName,
        addedCount: added,
        removedCount: removed,
      })
    );

    if (!resend) throw new Error("RESEND_API_KEY is not configured");

    await resend.emails.send({
      from: "Class Beyond <enquiries@classbeyondacademy.io>",
      to: [email],
      subject: "Your teaching schedule has been updated",
      html,
    });

    const { error: updateError } = await supabase
      .from("tutor_schedule_notifications")
      .update({ sent_at: new Date().toISOString() })
      .in("id", ids);

    if (updateError) throw updateError;

    console.log(`Schedule update email sent to ${email} covering ${ids.length} changes`);

    return new Response(
      JSON.stringify({ success: true, dryRun, tutorId, email, added, removed, sent: true, waiting }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-tutor-schedule-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
