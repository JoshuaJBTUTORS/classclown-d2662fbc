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

    if (!sessionId || !roomId) {
      return new Response(JSON.stringify({ error: "missing_session_or_room_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the lesson by room_id (session_id is what we're setting)
    const { data: lessonRow, error: lessonErr } = await supabase
      .from("lessons")
      .select("id, lesson_space_webhook_secret, lesson_space_session_id")
      .eq("lesson_space_room_id", roomId)
      .maybeSingle();

    if (lessonErr) {
      console.error(`[${rid}] lesson lookup failed:`, lessonErr.message);
    }
    if (!lessonRow?.id) {
      console.warn(`[${rid}] no lesson matched room_id=${roomId}; acknowledging without update`);
      return new Response(JSON.stringify({ success: true, matched: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify signature if we stored a secret for this lesson
    if (lessonRow.lesson_space_webhook_secret && signatureHeader) {
      const expected = await hmacSha256Hex(lessonRow.lesson_space_webhook_secret, rawBody);
      if (!timingSafeEq(expected, signatureHeader.trim())) {
        console.warn(`[${rid}] signature mismatch for lesson ${lessonRow.id}`);
        return new Response(JSON.stringify({ error: "invalid_signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn(`[${rid}] no stored secret or no signature — accepting (lesson=${lessonRow.id})`);
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
