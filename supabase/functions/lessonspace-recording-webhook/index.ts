// LessonSpace inbound webhook: recording.finish
//
// Docs: https://www.thelessonspace.com/docs/guide/recordings#webhooks
// Payload (documented): { room: {id}, session: {id}, recordingUrl, expires_at? }
// Signed with x-webhook-signature = HMAC-SHA256(rawBody, spaceSecret) [hex]
// Recording URL delivered here is valid for 24h (vs 12h on the polling GET).

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
    console.log(`[${rid}] Incoming recording webhook | event=${eventHeader} | bytes=${rawBody.length}`);

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionId: string | undefined = payload?.session?.id ?? payload?.sessionId;
    const roomId: string | undefined = payload?.room?.id ?? payload?.roomId;
    const recordingUrl: string | undefined =
      payload?.recordingUrl ?? payload?.recording_url ?? payload?.url;
    const providerExpiresAt: string | undefined = payload?.expires_at ?? payload?.expiresAt;

    if (!recordingUrl) {
      console.warn(`[${rid}] payload missing recording URL — ack without update`);
      return new Response(JSON.stringify({ success: true, matched: false, reason: "no_url" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match by session first, then room
    let lessonRow: any = null;
    if (sessionId) {
      const { data } = await supabase
        .from("lessons")
        .select("id, lesson_space_webhook_secret, lesson_space_recording_url")
        .eq("lesson_space_session_id", sessionId)
        .maybeSingle();
      lessonRow = data;
    }
    if (!lessonRow?.id && roomId) {
      const { data } = await supabase
        .from("lessons")
        .select("id, lesson_space_webhook_secret, lesson_space_recording_url")
        .eq("lesson_space_room_id", roomId)
        .maybeSingle();
      lessonRow = data;
    }

    if (!lessonRow?.id) {
      console.warn(`[${rid}] no lesson matched session=${sessionId} room=${roomId}`);
      return new Response(JSON.stringify({ success: true, matched: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify signature if we stored a secret
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

    const expiresAt = providerExpiresAt
      ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: updErr } = await supabase
      .from("lessons")
      .update({
        lesson_space_recording_url: recordingUrl,
        lesson_space_recording_expires_at: expiresAt,
      })
      .eq("id", lessonRow.id);

    if (updErr) {
      console.error(`[${rid}] lesson update failed:`, updErr.message);
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${rid}] recording stored for lesson ${lessonRow.id} (expires ${expiresAt})`);
    return new Response(JSON.stringify({ success: true, lessonId: lessonRow.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${rid}] recording webhook error:`, (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
