// Admin tool: replay a known-good LessonSpace session through our webhook
// pipeline to validate the transcript/recording storage code path without
// waiting for a live session end event.
//
// Flow:
//   1. Caller must be admin/owner (verified via user JWT).
//   2. Resolve the target session id (accept session_id directly or via lesson_id).
//   3. Fetch playback + transcription URLs from LessonSpace REST API.
//   4. POST a synthetic payload to lessonspace-transcript-webhook using an
//      internal x-replay-token that the webhook trusts.
//   5. Persist the recording URL on the matched lesson.
//   6. Return a summary of what happened.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const LESSONSPACE_API_KEY = Deno.env.get("LESSONSPACE_API_KEY")!;
const LESSONSPACE_REPLAY_TOKEN = Deno.env.get("LESSONSPACE_REPLAY_TOKEN")!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function lessonSpaceGet(path: string): Promise<{ ok: boolean; status: number; body: any }> {
  const r = await fetch(`https://api.thelessonspace.com/v2${path}`, {
    headers: {
      Authorization: `Organisation ${LESSONSPACE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  let body: any = null;
  try {
    body = await r.json();
  } catch {
    body = null;
  }
  return { ok: r.ok, status: r.status, body };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // AuthN + AuthZ: caller must be admin or owner.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "invalid_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id);
    const allowed = new Set(["admin", "owner"]);
    const isAllowed = (roles ?? []).some((r: any) => allowed.has(r.role));
    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    let sessionId: string | undefined = body.session_id;
    let lessonId: string | undefined = body.lesson_id;

    // Resolve session_id from lesson_id if needed.
    if (!sessionId && lessonId) {
      const { data: lesson } = await admin
        .from("lessons")
        .select("lesson_space_session_id, lesson_space_room_id, title")
        .eq("id", lessonId)
        .maybeSingle();
      if (!lesson) {
        return new Response(JSON.stringify({ error: "lesson_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      sessionId = lesson.lesson_space_session_id ?? undefined;
      if (!sessionId) {
        return new Response(
          JSON.stringify({
            error: "lesson_has_no_session_id",
            hint: "This lesson has no lesson_space_session_id stored; pick one that ran and produced a session.",
            lesson,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "session_id_or_lesson_id_required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch session metadata + transcription + playback URLs from LessonSpace.
    const [sessionMeta, transcription, playback] = await Promise.all([
      lessonSpaceGet(`/sessions/${sessionId}`),
      lessonSpaceGet(`/sessions/${sessionId}/transcription`),
      lessonSpaceGet(`/sessions/${sessionId}/playback`),
    ]);

    const roomId: string | undefined =
      sessionMeta.body?.room?.id ??
      sessionMeta.body?.room_id ??
      transcription.body?.room?.id;

    const transcriptionUrl: string | undefined =
      transcription.body?.url ??
      transcription.body?.transcription_url ??
      transcription.body?.transcriptionUrl;

    const recordingUrl: string | undefined =
      playback.body?.url ?? playback.body?.recording_url;

    const summary: Record<string, unknown> = {
      session_id: sessionId,
      lesson_space: {
        session_status: sessionMeta.status,
        transcription_status: transcription.status,
        playback_status: playback.status,
        room_id: roomId ?? null,
        transcription_url_present: !!transcriptionUrl,
        recording_url_present: !!recordingUrl,
      },
    };

    // Replay the transcript webhook if we have a URL.
    if (transcriptionUrl) {
      const replayPayload = {
        session: { id: sessionId },
        room: roomId ? { id: roomId } : undefined,
        transcriptionUrl,
      };
      const webhookRes = await fetch(
        `${SUPABASE_URL}/functions/v1/lessonspace-transcript-webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-replay-token": LESSONSPACE_REPLAY_TOKEN,
            "x-webhook-event": "transcription.finish",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: SUPABASE_SERVICE_ROLE_KEY,
          },
          body: JSON.stringify(replayPayload),
        },
      );
      const webhookBody = await webhookRes.text();
      summary.transcript_webhook = {
        status: webhookRes.status,
        body: webhookBody.slice(0, 2000),
      };
    } else {
      summary.transcript_webhook = { skipped: "no_transcription_url" };
    }

    // Save recording URL if we got one — match by session_id first, then room_id.
    if (recordingUrl) {
      let matchedLessonId: string | null = null;
      const { data: bySession } = await admin
        .from("lessons")
        .select("id")
        .eq("lesson_space_session_id", sessionId)
        .maybeSingle();
      if (bySession?.id) matchedLessonId = bySession.id;
      if (!matchedLessonId && roomId) {
        const { data: byRoom } = await admin
          .from("lessons")
          .select("id")
          .eq("lesson_space_room_id", roomId)
          .limit(1)
          .maybeSingle();
        if (byRoom?.id) matchedLessonId = byRoom.id;
      }
      if (matchedLessonId) {
        const { error: updErr } = await admin
          .from("lessons")
          .update({ lesson_space_recording_url: recordingUrl })
          .eq("id", matchedLessonId);
        summary.recording_saved = {
          lesson_id: matchedLessonId,
          error: updErr?.message ?? null,
          recording_url: recordingUrl,
        };
      } else {
        summary.recording_saved = { skipped: "no_matching_lesson", recording_url: recordingUrl };
      }
    } else {
      summary.recording_saved = { skipped: "no_recording_url" };
    }

    return new Response(JSON.stringify(summary, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("replay error:", e);
    return new Response(
      JSON.stringify({ error: "server_error", message: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
