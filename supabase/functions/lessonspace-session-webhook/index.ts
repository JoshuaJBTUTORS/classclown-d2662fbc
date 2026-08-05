// LessonSpace inbound webhook: session.start / session.end
//
// Docs: https://www.thelessonspace.com/docs/guide/webhooks#session-events
// Payload: { id: sessionId, room: {id: roomId}, summary?: {start, end}, reason? }
//
// Purpose: capture the definitive session_id for a lesson at the moment the
// session ends, replacing the fragile ±30min time-window heuristic in
// daily-lesson-processing / find-lesson-sessions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-id, x-webhook-event, x-webhook-timestamp, x-webhook-signature",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const rid = crypto.randomUUID().substring(0, 8);
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-webhook-signature") ?? "";
    const eventHeader = req.headers.get("x-webhook-event") ?? "";
    const webhookIdHeader = req.headers.get("x-webhook-id") ?? "";
    console.log(
      `[${rid}] 📥 INCOMING session webhook | event=${eventHeader} | webhookId=${webhookIdHeader} | sig=${signatureHeader ? "present" : "missing"} | bytes=${rawBody.length}`,
    );

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionId: string | undefined = payload?.id ?? payload?.session?.id;
    const roomId: string | undefined = payload?.room?.id ?? payload?.roomId;

    if (!roomId && !sessionId) {
      return new Response(JSON.stringify({ error: "missing_session_or_room_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the lesson by room_id (session_id is what we're setting)
    let lessonQuery = supabase
      .from("lessons")
      .select("id, lesson_space_webhook_secret, lesson_space_session_id")
      .limit(1);
    if (roomId) lessonQuery = lessonQuery.eq("lesson_space_room_id", roomId);
    else lessonQuery = lessonQuery.eq("lesson_space_session_id", sessionId!);

    const { data: lessonRow, error: lessonErr } = await lessonQuery.maybeSingle();

    if (lessonErr) {
      console.error(`[${rid}] lesson lookup failed:`, lessonErr.message);
    }

    // Verify signature if we stored a secret for this lesson (log only, never drop the event)
    if (lessonRow?.lesson_space_webhook_secret && signatureHeader) {
      const expected = await hmacSha256Hex(lessonRow.lesson_space_webhook_secret, rawBody);
      if (!timingSafeEq(expected, signatureHeader.trim())) {
        console.warn(`[${rid}] signature mismatch for lesson ${lessonRow.id} — accepting anyway`);
      }
    } else {
      console.warn(`[${rid}] no stored secret or no signature — accepting (lesson=${lessonRow?.id ?? "unknown"})`);
    }

    // ---- Participant join/leave tracking (user.joined / user.left) ----
    // LessonSpace sends the event name prefixed, e.g. "webhooks.user.joined"
    const normalizedEvent = eventHeader.replace(/^webhooks\./, "");
    const isUserEvent = normalizedEvent.startsWith("user.");
    if (isUserEvent) {
      const user = payload?.user ?? payload?.participant ?? {};
      const externalId: string | undefined = user?.id ?? payload?.userId;
      const role =
        user?.role ??
        (typeof externalId === "string" && externalId.startsWith("tutor_")
          ? "teacher"
          : typeof externalId === "string" && externalId.startsWith("student_")
            ? "student"
            : null);

      const { error: evErr } = await supabase.from("lesson_participant_events").insert({
        lesson_id: lessonRow?.id ?? null,
        room_id: roomId ?? null,
        session_id: sessionId ?? null,
        event_type: normalizedEvent,
        participant_external_id: externalId ?? null,
        participant_name: user?.name ?? null,
        participant_role: role,
        is_leader: typeof user?.leader === "boolean" ? user.leader : null,
        occurred_at: payload?.timestamp ?? new Date().toISOString(),
        raw_payload: payload,
      });
      if (evErr) console.error(`[${rid}] participant event insert failed:`, evErr.message);
      else
        console.log(
          `[${rid}] ${normalizedEvent} recorded | lesson=${lessonRow?.id ?? "unmatched"} | user=${user?.name ?? externalId ?? "unknown"} | role=${role ?? "unknown"}`,
        );

      return new Response(JSON.stringify({ success: true, recorded: eventHeader }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Session events ----
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "missing_session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log session.start / session.end for visibility too
    await supabase.from("lesson_participant_events").insert({
      lesson_id: lessonRow?.id ?? null,
      room_id: roomId ?? null,
      session_id: sessionId,
      event_type: normalizedEvent || "session.unknown",
      occurred_at: new Date().toISOString(),
      raw_payload: payload,
    });

    if (!lessonRow?.id) {
      console.warn(`[${rid}] no lesson matched room_id=${roomId}; acknowledging without update`);
      return new Response(JSON.stringify({ success: true, matched: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // Only overwrite if we don't already have a session_id, to avoid clobbering
    if (lessonRow.lesson_space_session_id && lessonRow.lesson_space_session_id !== sessionId) {
      console.log(
        `[${rid}] lesson ${lessonRow.id} already has session_id=${lessonRow.lesson_space_session_id}; incoming=${sessionId}. Keeping first.`,
      );
      return new Response(JSON.stringify({ success: true, replaced: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await supabase
      .from("lessons")
      .update({ lesson_space_session_id: sessionId })
      .eq("id", lessonRow.id);

    if (updErr) {
      console.error(`[${rid}] lesson update failed:`, updErr.message);
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If a transcript row was already created (orphan) for this session_id,
    // backfill the lesson_id link now.
    await supabase
      .from("lesson_transcriptions")
      .update({ lesson_id: lessonRow.id })
      .eq("session_id", sessionId)
      .is("lesson_id", null);

    console.log(`[${rid}] lesson ${lessonRow.id} session_id set to ${sessionId}`);
    return new Response(JSON.stringify({ success: true, lessonId: lessonRow.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${rid}] webhook handler error:`, (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
