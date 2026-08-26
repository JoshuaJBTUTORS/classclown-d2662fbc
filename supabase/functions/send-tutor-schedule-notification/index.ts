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
    try {
      const body = await req.json();
      dryRun = body?.dryRun === true;
    } catch (_e) {
      // no body, treat as live run
    }

    const { data: pending, error: pendingError } = await supabase
      .from("tutor_schedule_notifications")
      .select("id, tutor_id, change_type, queued_at")
      .is("sent_at", null)
      .order("queued_at", { ascending: true })
      .limit(5000);

    if (pendingError) throw pendingError;

    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ success: true, dryRun, processed: 0, message: "Nothing queued" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by tutor
    const byTutor = new Map<
      string,
      { ids: string[]; added: number; removed: number; latest: number }
    >();

    for (const row of pending) {
      const entry = byTutor.get(row.tutor_id) || { ids: [], added: 0, removed: 0, latest: 0 };
      entry.ids.push(row.id);
      if (row.change_type === "added") entry.added += 1;
      else entry.removed += 1;
      const ts = new Date(row.queued_at).getTime();
      if (ts > entry.latest) entry.latest = ts;
      byTutor.set(row.tutor_id, entry);
    }

    const cutoff = Date.now() - COOLDOWN_MINUTES * 60 * 1000;
    const ready = [...byTutor.entries()].filter(([, e]) => e.latest <= cutoff);
    const waiting = byTutor.size - ready.length;

    if (ready.length === 0) {
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

    const tutorIds = ready.map(([tutorId]) => tutorId);
    const { data: tutors, error: tutorsError } = await supabase
      .from("tutors")
      .select("id, first_name, last_name, email")
      .in("id", tutorIds);

    if (tutorsError) throw tutorsError;

    const tutorMap = new Map((tutors || []).map((t) => [t.id, t]));

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;

    const results: Array<Record<string, unknown>> = [];

    for (const [tutorId, entry] of ready) {
      const tutor = tutorMap.get(tutorId);
      const tutorName = tutor ? tutor.first_name : "there";
      const email = tutor?.email || null;

      if (!email) {
        console.log(`Tutor ${tutorId} has no email on file, marking queue rows as handled`);
        if (!dryRun) {
          await supabase
            .from("tutor_schedule_notifications")
            .update({ sent_at: new Date().toISOString() })
            .in("id", entry.ids);
        }
        results.push({ tutorId, skipped: "no email", changes: entry.ids.length });
        continue;
      }

      if (dryRun) {
        results.push({
          tutorId,
          email,
          added: entry.added,
          removed: entry.removed,
          changes: entry.ids.length,
          wouldSend: true,
        });
        continue;
      }

      try {
        const html = await renderAsync(
          React.createElement(TutorScheduleUpdateEmail, {
            tutorName,
            addedCount: entry.added,
            removedCount: entry.removed,
          })
        );

        if (!resend) throw new Error("RESEND_API_KEY is not configured");

        await resend.emails.send({
          from: "Class Beyond <enquiries@classbeyondacademy.io>",
          to: [email],
          subject: "Your teaching schedule has been updated",
          html,
        });

        await supabase
          .from("tutor_schedule_notifications")
          .update({ sent_at: new Date().toISOString() })
          .in("id", entry.ids);

        console.log(`Schedule update email sent to ${email} covering ${entry.ids.length} changes`);
        results.push({
          tutorId,
          email,
          added: entry.added,
          removed: entry.removed,
          sent: true,
        });
      } catch (err) {
        console.error(`Failed to email tutor ${tutorId}:`, err);
        results.push({ tutorId, email, sent: false, error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, dryRun, waiting, results }),
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
