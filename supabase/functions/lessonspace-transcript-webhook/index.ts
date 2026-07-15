// LessonSpace inbound webhook: transcription.finish
//
// Docs: https://www.thelessonspace.com/docs/guide/transcriptions#webhooks
// Payload: { room: {id}, session: {id}, transcriptionUrl }
// Signed with x-webhook-signature = HMAC-SHA256(rawBody, spaceSecret) [hex]
// URL delivered here is valid for 24 hours (vs 12h on the polling GET).

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

// Parse LessonSpace transcript JSON per docs:
// [{ start_time, end_time, user: {id, name}, breakout_id, text }]
function parseTranscriptSegments(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw
      .map((seg: any) => {
        const name = seg?.user?.name ?? "Unknown";
        const text = (seg?.text ?? "").toString().trim();
        return text ? `${name}: ${text}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  // Defensive fallbacks for older/alternative payload shapes
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const anyRaw = raw as any;
    if (anyRaw.transcript) return parseTranscriptSegments(anyRaw.transcript);
    if (anyRaw.text) return String(anyRaw.text);
    if (anyRaw.transcription) return parseTranscriptSegments(anyRaw.transcription);
  }
  return JSON.stringify(raw);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rid = crypto.randomUUID().substring(0, 8);
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-webhook-signature") ?? "";
    const eventHeader = req.headers.get("x-webhook-event") ?? "";
    console.log(`[${rid}] Incoming transcript webhook | event=${eventHeader} | bytes=${rawBody.length}`);

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionId: string | undefined = payload?.session?.id;
    const roomId: string | undefined = payload?.room?.id;
    const transcriptionUrl: string | undefined = payload?.transcriptionUrl;

    if (!sessionId && !roomId) {
      return new Response(JSON.stringify({ error: "missing_session_or_room_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!transcriptionUrl) {
      return new Response(JSON.stringify({ error: "missing_transcription_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the matching lesson to pull its stored space secret
    let lessonQuery = supabase
      .from("lessons")
      .select("id, lesson_space_webhook_secret, lesson_space_session_id, lesson_space_room_id")
      .limit(1);
    if (sessionId) lessonQuery = lessonQuery.eq("lesson_space_session_id", sessionId);
    else lessonQuery = lessonQuery.eq("lesson_space_room_id", roomId);

    const { data: lessonRow, error: lessonErr } = await lessonQuery.maybeSingle();
    if (lessonErr) {
      console.error(`[${rid}] lesson lookup failed:`, lessonErr.message);
    }

    // If we have a stored secret, verify the signature. If not, log and accept
    // (rollout: historical lessons launched before webhook adoption won't have one).
    if (lessonRow?.lesson_space_webhook_secret && signatureHeader) {
      const expected = await hmacSha256Hex(lessonRow.lesson_space_webhook_secret, rawBody);
      if (!timingSafeEq(expected, signatureHeader.trim())) {
        console.warn(`[${rid}] signature mismatch for lesson ${lessonRow.id}`);
        return new Response(JSON.stringify({ error: "invalid_signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`[${rid}] signature verified for lesson ${lessonRow.id}`);
    } else {
      console.warn(
        `[${rid}] no stored secret or no signature header — accepting without verification (lesson=${lessonRow?.id ?? "unknown"})`,
      );
    }

    if (!lessonRow?.id) {
      // We still fetch and store keyed by session_id — future join will surface it
      console.warn(`[${rid}] no lesson matched session=${sessionId} room=${roomId}; storing orphan transcript row`);
    }

    // Fetch the transcript body ONCE, off the hot path.
    let transcriptionText: string | null = null;
    let transcriptSize = 0;
    let fetchOk = false;
    try {
      const r = await fetch(transcriptionUrl);
      if (r.ok) {
        const contentType = r.headers.get("content-type") ?? "";
        const body = await r.text();
        try {
          const parsed = contentType.includes("json") ? JSON.parse(body) : JSON.parse(body);
          transcriptionText = parseTranscriptSegments(parsed);
        } catch {
          transcriptionText = body;
        }
        transcriptSize = new TextEncoder().encode(transcriptionText ?? "").length;
        fetchOk = true;
      } else {
        console.error(`[${rid}] transcript URL fetch failed: ${r.status}`);
      }
    } catch (e) {
      console.error(`[${rid}] transcript URL fetch error:`, (e as Error).message);
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // webhook = 24h

    const upsertRow: Record<string, unknown> = {
      lesson_id: lessonRow?.id ?? null,
      session_id: sessionId ?? lessonRow?.lesson_space_session_id ?? null,
      transcription_url: transcriptionUrl,
      transcription_status: fetchOk ? "completed" : "available",
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };
    if (fetchOk) {
      upsertRow.transcription_text = transcriptionText;
      upsertRow.transcript_size_bytes = transcriptSize;
    }

    if (lessonRow?.id) {
      const { error: upErr } = await supabase
        .from("lesson_transcriptions")
        .upsert(upsertRow, { onConflict: "lesson_id", ignoreDuplicates: false });
      if (upErr) {
        console.error(`[${rid}] transcript upsert failed:`, upErr.message);
        return new Response(JSON.stringify({ error: upErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // No lesson row to key on — insert loosely, will be reconciled when session captured
      const { error: insErr } = await supabase.from("lesson_transcriptions").insert(upsertRow);
      if (insErr) console.error(`[${rid}] orphan transcript insert failed:`, insErr.message);
    }

    console.log(`[${rid}] transcript stored (fetchOk=${fetchOk}, size=${transcriptSize})`);
    return new Response(
      JSON.stringify({ success: true, fetched: fetchOk, size: transcriptSize }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(`[${rid}] webhook handler error:`, (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
