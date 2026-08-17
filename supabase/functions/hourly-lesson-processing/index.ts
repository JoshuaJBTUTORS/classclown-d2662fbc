// Hourly transcript/summary worker.
//
// Design notes (rewritten after the 3-9 Aug 2026 gap, where 26 of 106 lessons
// silently produced no transcript):
//  * The queue is STATEFUL: a lesson stays eligible for up to 7 days until its
//    transcript is `completed` or it is terminally marked `unavailable`.
//    Retry cadence lives on lesson_transcriptions.next_poll_at with back-off.
//  * The run is CHUNKED with handoff: each invocation takes a fixed slice
//    (oldest first) and self-invokes for the remainder BEFORE processing, so a
//    mid-run death can no longer take the tail of the queue with it.
//  * "URL known" and "text downloaded" are separate steps. A polled URL only
//    lives 12h, so an expired URL triggers a fresh poll rather than a retry of
//    a dead link.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 12;
const MAX_RUNTIME_MS = 90_000;
const MAX_POLL_ATTEMPTS = 14;
const MAX_AGE_DAYS = 7;
const MIN_AGE_MS = 3 * 60 * 60 * 1000; // lesson must have ended >= 3h ago

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, serviceKey);

interface Stats {
  candidates: number;
  processed: number;
  sessions_discovered: number;
  recordings_stored: number;
  transcripts_completed: number;
  summaries_kicked_off: number;
  marked_unavailable: number;
  deferred: number;
}

function backoffMs(attempts: number): number {
  // 30m, 1h, 2h, 4h, 8h, then 12h ceiling
  const minutes = Math.min(30 * Math.pow(2, Math.max(0, attempts - 1)), 12 * 60);
  return minutes * 60 * 1000;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  const stats: Stats = {
    candidates: 0,
    processed: 0,
    sessions_discovered: 0,
    recordings_stored: 0,
    transcripts_completed: 0,
    summaries_kicked_off: 0,
    marked_unavailable: 0,
    deferred: 0,
  };

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // cron sends a body, manual calls may not
    }

    // Handoff payload: an explicit list of lesson ids still to do.
    let queue: string[] = Array.isArray(body?.lesson_ids) ? body.lesson_ids : [];

    if (queue.length === 0) {
      queue = await buildQueue();
    }
    stats.candidates = queue.length;

    const batch = queue.slice(0, BATCH_SIZE);
    const remaining = queue.slice(BATCH_SIZE);

    // Hand off the tail FIRST so a death mid-batch cannot lose it.
    if (remaining.length > 0) {
      fetch(`${supabaseUrl}/functions/v1/hourly-lesson-processing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ lesson_ids: remaining, handoff: true }),
      }).catch((e) => console.error("handoff invoke failed:", (e as Error).message));
      console.log(`Handed off ${remaining.length} lessons to a follow-up invocation`);
    }

    console.log(`Processing batch of ${batch.length} lessons (queue=${queue.length})`);

    for (const lessonId of batch) {
      if (Date.now() - startedAt > MAX_RUNTIME_MS) {
        console.warn("Runtime cut-off reached; remaining batch items stay queued for next run");
        break;
      }
      try {
        await processLesson(lessonId, stats);
      } catch (e) {
        console.error(`Lesson ${lessonId} failed:`, (e as Error).message);
      }
      stats.processed++;
      await sleep(500);
    }

    console.log("Hourly processing finished:", stats);
    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in hourly-lesson-processing:", (error as Error).message);
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Every lesson that ended between 7 days and 3 hours ago and does not yet have
 * a completed transcript (or has one but no summaries), oldest first, honouring
 * per-row back-off.
 */
async function buildQueue(): Promise<string[]> {
  const now = Date.now();
  const cutoff = new Date(now - MIN_AGE_MS).toISOString();
  const windowStart = new Date(now - MAX_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, end_time")
    .lte("end_time", cutoff)
    .gte("end_time", windowStart)
    .neq("status", "cancelled")
    .order("end_time", { ascending: true })
    .limit(500);

  if (error) throw new Error(`Failed to fetch lessons: ${error.message}`);
  if (!lessons?.length) return [];

  const ids = lessons.map((l) => l.id);

  const { data: transcripts } = await supabase
    .from("lesson_transcriptions")
    .select("lesson_id, transcription_status, transcription_text, next_poll_at, transcript_poll_attempts")
    .in("lesson_id", ids);

  const byLesson = new Map<string, any>();
  for (const t of transcripts ?? []) byLesson.set(t.lesson_id, t);

  // Lessons that already have summaries need no work at all.
  const { data: summarised } = await supabase
    .from("lesson_student_summaries")
    .select("lesson_id")
    .in("lesson_id", ids);
  const done = new Set((summarised ?? []).map((s: any) => s.lesson_id));

  const queue: string[] = [];
  for (const lesson of lessons) {
    if (done.has(lesson.id)) continue;
    const t = byLesson.get(lesson.id);
    if (t?.transcription_status === "unavailable") continue;
    if (t?.next_poll_at && new Date(t.next_poll_at).getTime() > now) continue;
    queue.push(lesson.id);
  }
  return queue;
}

async function processLesson(lessonId: string, stats: Stats) {
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, end_time, lesson_space_room_id, lesson_space_session_id, lesson_space_recording_url, lesson_students(student_id)")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) return;

  // Step 1: session discovery
  if (!lesson.lesson_space_session_id && lesson.lesson_space_room_id) {
    const { data: sessionResult, error } = await supabase.functions.invoke("find-lesson-sessions", {
      body: { action: "find_session_ids", lesson_ids: [lesson.id] },
    });
    if (error) {
      console.error(`find-lesson-sessions failed for ${lesson.id}:`, error.message);
    } else {
      const found = sessionResult?.results?.[0]?.session_id;
      if (found) {
        lesson.lesson_space_session_id = found;
        stats.sessions_discovered++;
      }
    }
  }

  if (!lesson.lesson_space_session_id) {
    const { data: existingRow } = await supabase
      .from("lesson_transcriptions")
      .select("id, transcript_poll_attempts")
      .eq("lesson_id", lesson.id)
      .maybeSingle();
    await deferTranscript(lesson.id, null, existingRow, "No LessonSpace session found yet", lesson.end_time, stats);
    return;
  }


  // Step 2: recording fallback (webhook normally covers this)
  if (!lesson.lesson_space_recording_url) {
    const { error } = await supabase.functions.invoke("get-lessonspace-recording", {
      body: { sessionId: lesson.lesson_space_session_id },
    });
    if (!error) stats.recordings_stored++;
  }

  // Step 3: transcript
  const completed = await ensureTranscript(lesson, stats);
  if (!completed) return;

  // Step 4: summaries (fire-and-forget — generation takes 60-120s)
  if (lesson.lesson_students?.length) {
    await ensureSummaries(lesson.id, stats);
  }
}

/** Returns true when the row holds downloaded transcript text. */
async function ensureTranscript(lesson: any, stats: Stats): Promise<boolean> {
  const { data: row } = await supabase
    .from("lesson_transcriptions")
    .select("id, transcription_status, transcription_url, transcription_text, expires_at, transcript_poll_attempts")
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  if (row?.transcription_text) {
    if (row.transcription_status !== "completed") {
      await supabase
        .from("lesson_transcriptions")
        .update({ transcription_status: "completed", updated_at: new Date().toISOString() })
        .eq("id", row.id);
    }
    return true;
  }

  const urlIsLive =
    !!row?.transcription_url && !!row?.expires_at && new Date(row.expires_at).getTime() > Date.now();

  // 3a: we hold a live URL — just download the text.
  if (urlIsLive) {
    const ok = await downloadText(lesson.id, row!.transcription_url as string);
    if (ok) {
      stats.transcripts_completed++;
      return true;
    }
    await deferTranscript(lesson.id, lesson.lesson_space_session_id, row, "Transcript URL download failed", lesson.end_time, stats);
    return false;
  }

  // 3b: no live URL — ask LessonSpace for a fresh one, then download immediately.
  let pollError = (await supabase.functions.invoke("generate-lesson-summaries", {
    body: { action: "get-transcription", lessonId: lesson.id },
  })).error;

  let refreshed = (await supabase
    .from("lesson_transcriptions")
    .select("id, transcription_url, transcription_text, expires_at, transcript_poll_attempts")
    .eq("lesson_id", lesson.id)
    .maybeSingle()).data;

  // Self-heal: the session bound to this lesson may be the wrong one (rooms are
  // reused week after week). Re-run selection with the current filters and, if a
  // different session is chosen, repoint the transcript row and retry at once.
  if (!refreshed?.transcription_url && lesson.lesson_space_room_id) {
    const rebound = await reselectSession(lesson, row ?? refreshed, stats);
    if (rebound) {
      pollError = (await supabase.functions.invoke("generate-lesson-summaries", {
        body: { action: "get-transcription", lessonId: lesson.id },
      })).error;
      refreshed = (await supabase
        .from("lesson_transcriptions")
        .select("id, transcription_url, transcription_text, expires_at, transcript_poll_attempts")
        .eq("lesson_id", lesson.id)
        .maybeSingle()).data;
    }
  }

  if (refreshed?.transcription_url && (!refreshed.expires_at || new Date(refreshed.expires_at).getTime() > Date.now())) {
    const ok = await downloadText(lesson.id, refreshed.transcription_url);
    if (ok) {
      stats.transcripts_completed++;
      return true;
    }
  }


  await deferTranscript(
    lesson.id,
    lesson.lesson_space_session_id,
    refreshed ?? row,
    pollError ? `Transcript poll error: ${pollError.message}` : "Transcript not ready at LessonSpace",
    lesson.end_time,
    stats,
  );

  return false;
}

/**
 * Force a fresh session selection for this lesson's room (multi-participant,
 * newest first) and repoint the transcript row when a different session wins.
 * Returns true when the lesson now points at a new session.
 */
async function reselectSession(lesson: any, row: any, stats: Stats): Promise<boolean> {
  const previous = lesson.lesson_space_session_id;
  const { data, error } = await supabase.functions.invoke("find-lesson-sessions", {
    body: { action: "find_session_ids", lesson_ids: [lesson.id], force: true },
  });
  if (error) {
    console.error(`Re-selection failed for lesson ${lesson.id}:`, error.message);
    return false;
  }
  const found = data?.results?.[0]?.session_id;
  if (!found || found === previous) return false;

  lesson.lesson_space_session_id = found;
  stats.sessions_discovered++;
  console.log(`Lesson ${lesson.id} repointed from session ${previous ?? "none"} to ${found}`);

  if (row?.id) {
    await supabase
      .from("lesson_transcriptions")
      .update({
        session_id: found,
        transcription_url: null,
        expires_at: null,
        transcription_status: "processing",
        last_poll_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
  }
  return true;
}


async function downloadText(lessonId: string, url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Transcript download for ${lessonId} returned ${res.status}`);
      return false;
    }
    const body = await res.text();
    const text = parseTranscript(body);
    if (!text.trim()) return false;

    const { error } = await supabase
      .from("lesson_transcriptions")
      .update({
        transcription_text: text,
        transcript_size_bytes: new TextEncoder().encode(text).length,
        transcription_status: "completed",
        last_poll_error: null,
        next_poll_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("lesson_id", lessonId);

    if (error) {
      console.error(`Failed to store transcript for ${lessonId}:`, error.message);
      return false;
    }
    console.log(`Transcript stored for lesson ${lessonId} (${text.length} chars)`);
    return true;
  } catch (e) {
    console.error(`Transcript download for ${lessonId} threw:`, (e as Error).message);
    return false;
  }
}

// LessonSpace transcripts are [{ user: {name}, text }] JSON; tolerate plain text.
function parseTranscript(body: string): string {
  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) {
      return parsed
        .map((seg: any) => {
          const name = seg?.user?.name ?? "Unknown";
          const text = (seg?.text ?? "").toString().trim();
          return text ? `${name}: ${text}` : "";
        })
        .filter(Boolean)
        .join("\n");
    }
    if (parsed && typeof parsed === "object" && typeof parsed.text === "string") return parsed.text;
    return body;
  } catch {
    return body;
  }
}

/** Record the failed attempt and schedule the next one, or give up terminally. */
async function deferTranscript(
  lessonId: string,
  sessionId: string | null,
  row: any,
  reason: string,
  lessonEndTime: string,
  stats: Stats,
) {
  const attempts = (row?.transcript_poll_attempts ?? 0) + 1;
  const ageMs = Date.now() - new Date(lessonEndTime).getTime();
  const exhausted = attempts >= MAX_POLL_ATTEMPTS || ageMs > MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

  const update: Record<string, unknown> = {
    transcript_poll_attempts: attempts,
    last_poll_error: reason,
    updated_at: new Date().toISOString(),
  };

  if (exhausted) {
    update.transcription_status = "unavailable";
    update.next_poll_at = null;
    stats.marked_unavailable++;
    console.warn(`Lesson ${lessonId} marked transcript unavailable after ${attempts} attempts: ${reason}`);
  } else {
    update.next_poll_at = new Date(Date.now() + backoffMs(attempts)).toISOString();
    stats.deferred++;
    console.log(`Lesson ${lessonId} deferred (attempt ${attempts}): ${reason}`);
  }

  // session_id is NOT NULL, so a partial upsert would wipe it — update in place
  // when a row exists and only insert (with the session id) when it does not.
  let error;
  if (row?.id) {
    ({ error } = await supabase.from("lesson_transcriptions").update(update).eq("id", row.id));
  } else if (sessionId) {
    ({ error } = await supabase
      .from("lesson_transcriptions")
      .upsert({ ...update, lesson_id: lessonId, session_id: sessionId }, {
        onConflict: "lesson_id",
        ignoreDuplicates: false,
      }));
  } else {
    // No row and no session id yet — nothing safe to persist; the lesson stays
    // in the queue and will be retried on the next run.
    return;
  }
  if (error) console.error(`Failed to record transcript attempt for ${lessonId}:`, error.message);
}


async function ensureSummaries(lessonId: string, stats: Stats) {
  const { data: transcription } = await supabase
    .from("lesson_transcriptions")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("transcription_status", "completed")
    .maybeSingle();

  if (!transcription) return;

  const { data: existing } = await supabase
    .from("lesson_student_summaries")
    .select("id")
    .eq("lesson_id", lessonId)
    .limit(1);

  if (existing && existing.length > 0) return;

  fetch(`${supabaseUrl}/functions/v1/generate-lesson-summaries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      action: "generate-summaries",
      lessonId,
      transcriptionId: transcription.id,
    }),
  }).catch((e) => console.error(`Summary invoke failed for ${lessonId}:`, (e as Error).message));

  stats.summaries_kicked_off++;
}
