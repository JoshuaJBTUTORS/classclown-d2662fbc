import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { WeeklyHomeworkReleaseEmail } from "./_templates/weekly-homework-release-email.tsx";
import { whatsappService } from "../_shared/whatsapp-service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Weekly Homework Sync → HeyCleo
 *
 * Aggregates each active student's homework briefs from the London week that
 * just ended, groups by subject, and POSTs the summary to the HeyCleo receiver
 * so HeyCleo can generate the actual homework per child.
 *
 * Design mirrors `heycleo-homework-webhook`:
 *  - CORS + OPTIONS preflight
 *  - POST-only, JSON, snake_case payloads
 *  - Shared secret via HEYCLEO_CROSS_PLATFORM_SECRET (body + header)
 *  - Structured console logging
 *  - Per-student outcomes logged to `notifications`
 *
 * Body (all optional):
 *   { week_start?: "YYYY-MM-DD",  // London Monday; default = previous Monday
 *     student_ids?: number[],     // subset of students to sync
 *     dry_run?: boolean }         // build payloads, log, but don't POST
 */

interface SubjectAggregate {
  subject: string;
  year_group: string | null;
  topics: string[];
  difficulty_tag: number; // 1 or 2
  lesson_count: number;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// Monday 00:00 of the London week that contains d.
function londonMondayOf(d: Date): Date {
  const london = new Date(d.toLocaleString("en-US", { timeZone: "Europe/London" }));
  const day = london.getDay();
  const diffToMonday = (day + 6) % 7;
  london.setHours(0, 0, 0, 0);
  london.setDate(london.getDate() - diffToMonday);
  return london;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function pickMostCommon<T extends string | null>(values: T[]): T | null {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [k, c] of counts) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return (best ?? null) as T | null;
}

// Hard filter: exclude Non-Verbal Reasoning (NVR) from HeyCleo sync.
// Tolerates variants like "NVR", "Non-Verbal Reasoning", "nonverbal reasoning".
// Verbal Reasoning (VR) and other 11+ subjects are NOT filtered.
function isNvrSubject(...values: (string | null | undefined)[]): boolean {
  for (const raw of values) {
    if (!raw) continue;
    const s = String(raw).toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
    if (!s) continue;
    if (/(^|[^a-z])nvr([^a-z]|$)/.test(s)) return true;
    if (s.includes("non verbal reasoning")) return true;
    if (s.includes("nonverbal reasoning")) return true;
  }
  return false;
}


async function postWithRetry(url: string, headers: Record<string, string>, body: string) {
  const maxAttempts = 3;
  let lastStatus = 0;
  let lastBody = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", headers, body });
      lastStatus = res.status;
      lastBody = await res.text();
      if (res.ok) return { ok: true, status: res.status, body: lastBody };
      // Retry on 5xx, give up on 4xx
      if (res.status < 500) return { ok: false, status: res.status, body: lastBody };
    } catch (err) {
      lastStatus = 0;
      lastBody = err instanceof Error ? err.message : String(err);
    }
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    }
  }
  return { ok: false, status: lastStatus, body: lastBody };
}

// -----------------------------------------------------------------------------
// Weekly homework release announcement
// -----------------------------------------------------------------------------

const RELEASE_SUBJECT = "Your new homework is ready";

const RELEASE_MESSAGE = `Hello,

Hope you're well. Your new homework is now ready to complete.

A quick reminder that homework is compulsory and forms part of your ongoing lessons. Homework is released every Monday and should be completed by Friday. If homework remains incomplete for more than 5 days after the deadline, access to future lessons may be temporarily restricted until it has been completed.

Homework should usually take around 20 to 30 minutes to complete. If you would like additional homework, please contact your account manager.

How to access your homework:

Go to ClassClownCRM.com. This is the same site you use to join your lessons.

Click Homework in the menu.

This will open HeyCleo, our learning platform currently being deployed in schools across the UK.

Complete all of the questions on the platform.

Once finished, click Complete Homework.

That's it. Your homework will then be marked as complete.`;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalisePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  if (!trimmed) return null;
  return whatsappService.formatPhoneNumber(trimmed);
}

/**
 * Sends the weekly homework release announcement to the given contacts by
 * email and WhatsApp. Idempotent per (week, channel, contact) using the
 * `notifications` table.
 */
async function notifyContacts(
  service: any,
  resend: Resend | null,
  weekStartIso: string,
  studentId: number,
  emails: string[],
  phones: string[],
): Promise<{ emailsSent: number; whatsappSent: number; errors: string[] }> {
  const errors: string[] = [];
  let emailsSent = 0;
  let whatsappSent = 0;

  const html = await renderAsync(React.createElement(WeeklyHomeworkReleaseEmail));

  for (const email of emails) {
    const logKey = `email:${email}`;
    const { data: existing } = await service
      .from("notifications")
      .select("id")
      .eq("type", "weekly_homework_release")
      .eq("email", logKey)
      .eq("subject", weekStartIso)
      .eq("status", "sent")
      .limit(1);
    if (existing && existing.length > 0) {
      console.log("[weekly-homework-sync] Email already sent this week", { studentId, email });
      continue;
    }

    if (!resend) {
      errors.push("RESEND_API_KEY not configured");
      break;
    }

    try {
      const { error } = await resend.emails.send({
        from: "Class Beyond Academy <enquiries@classbeyondacademy.io>",
        to: [email],
        subject: RELEASE_SUBJECT,
        html,
        text: RELEASE_MESSAGE,
      });
      if (error) throw new Error(typeof error === "string" ? error : JSON.stringify(error));
      emailsSent += 1;
      await service.from("notifications").insert({
        type: "weekly_homework_release",
        subject: weekStartIso,
        email: logKey,
        status: "sent",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[weekly-homework-sync] Email failed", { studentId, email, msg });
      errors.push(`email ${email}: ${msg}`);
      await service.from("notifications").insert({
        type: "weekly_homework_release",
        subject: weekStartIso,
        email: logKey,
        status: "failed",
      });
    }
  }

  for (const phone of phones) {
    const logKey = `whatsapp:${phone}`;
    const { data: existing } = await service
      .from("notifications")
      .select("id")
      .eq("type", "weekly_homework_release")
      .eq("email", logKey)
      .eq("subject", weekStartIso)
      .eq("status", "sent")
      .limit(1);
    if (existing && existing.length > 0) {
      console.log("[weekly-homework-sync] WhatsApp already sent this week", { studentId, phone });
      continue;
    }

    const result = await whatsappService.sendMessage({ phoneNumber: phone, text: RELEASE_MESSAGE });
    if (result.success) {
      whatsappSent += 1;
    } else {
      console.error("[weekly-homework-sync] WhatsApp failed", { studentId, phone, error: result.error });
      errors.push(`whatsapp ${phone}: ${result.error}`);
    }
    await service.from("notifications").insert({
      type: "weekly_homework_release",
      subject: weekStartIso,
      email: logKey,
      status: result.success ? "sent" : "failed",
    });
  }

  return { emailsSent, whatsappSent, errors };
}


// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const sharedSecret = Deno.env.get("HEYCLEO_CROSS_PLATFORM_SECRET") ?? "";
    const receiverUrl = Deno.env.get("HEYCLEO_WEEKLY_HOMEWORK_URL")
      ?? "https://vfhftrmneaizgdvngfwe.supabase.co/functions/v1/weekly-homework-receiver";


    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Supabase env not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!sharedSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "HEYCLEO_CROSS_PLATFORM_SECRET not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const service = createClient(supabaseUrl, serviceKey);

    // Parse body (optional).
    let body: {
      week_start?: string;
      student_ids?: number[];
      dry_run?: boolean;
      notify?: boolean;
      notify_only?: boolean;
      delay_ms?: number;
      batch_size?: number;
    } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Resolve week (defaults to the London Monday of the PREVIOUS week).
    let weekStart: Date;
    if (body.week_start) {
      weekStart = new Date(`${body.week_start}T00:00:00`);
      if (isNaN(weekStart.getTime())) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid week_start (expected YYYY-MM-DD)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      const thisMonday = londonMondayOf(new Date());
      weekStart = new Date(thisMonday);
      weekStart.setDate(weekStart.getDate() - 7);
    }
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekStartIso = toIsoDate(weekStart);
    const weekEndIso = toIsoDate(weekEnd);

    console.log("[weekly-homework-sync] Window", { weekStartIso, weekEndIso, dryRun: !!body.dry_run });

    // Fetch summaries with homework briefs in the window.
    let query = service
      .from("lesson_student_summaries")
      .select(
        "id, student_id, lesson_id, homework_brief, lessons!inner(id, subject, start_time, status)"
      )
      .not("homework_brief", "is", null)
      .gte("lessons.start_time", weekStart.toISOString())
      .lt("lessons.start_time", weekEnd.toISOString())
      .neq("lessons.status", "cancelled");

    if (body.student_ids && body.student_ids.length > 0) {
      query = query.in("student_id", body.student_ids);
    }

    const { data: summaries, error: sumErr } = await query;
    if (sumErr) throw sumErr;

    // Fetch attendance for these lessons/students to filter out no-shows.
    const pairs = (summaries ?? []).map((s: any) => ({ lesson_id: s.lesson_id, student_id: s.student_id }));
    const lessonIds = Array.from(new Set(pairs.map((p) => p.lesson_id)));
    const studentIds = Array.from(new Set(pairs.map((p) => p.student_id)));

    const attendanceMap = new Map<string, string>(); // `${lesson}|${student}` -> status
    if (lessonIds.length > 0 && studentIds.length > 0) {
      const { data: attRows } = await service
        .from("lesson_attendance")
        .select("lesson_id, student_id, attendance_status")
        .in("lesson_id", lessonIds)
        .in("student_id", studentIds);
      (attRows ?? []).forEach((r: any) => {
        attendanceMap.set(`${r.lesson_id}|${r.student_id}`, r.attendance_status);
      });
    }

    // Aggregate: student -> subject -> aggregate.
    type StudentAgg = Map<string, {
      subject: string;
      year_groups: (string | null)[];
      topicsSet: Set<string>;
      difficulty: number;
      lesson_count: number;
    }>;
    const byStudent = new Map<number, StudentAgg>();

    (summaries ?? []).forEach((row: any) => {
      const att = attendanceMap.get(`${row.lesson_id}|${row.student_id}`);
      if (att && !["attended", "late"].includes(att)) return;

      const brief = row.homework_brief || {};

      // New multi-subject shape: brief.subjects = [{ subject, topics, difficulty_tag }, ...]
      // Legacy flat shape: { subject, topics, difficulty_tag } — treat as one entry.
      const entries: any[] = Array.isArray(brief.subjects) && brief.subjects.length > 0
        ? brief.subjects
        : [brief];

      for (const entry of entries) {
        const subject: string = (entry?.subject || row.lessons?.subject || "").trim();
        if (!subject) continue;

        // Hard filter: exclude NVR entirely.
        if (isNvrSubject(subject, entry?.subject, row.lessons?.subject)) {
          console.log("[weekly-homework-sync] Skipping NVR row", { studentId: row.student_id, subject });
          continue;
        }

        const topics: string[] = Array.isArray(entry?.topics) ? entry.topics.filter(Boolean) : [];
        const year: string | null = entry?.year_group || brief.year_group || null;
        const difficultyRaw = Number(entry?.difficulty_tag ?? brief.difficulty_tag);
        const difficulty = difficultyRaw === 2 ? 2 : 1;

        if (!byStudent.has(row.student_id)) byStudent.set(row.student_id, new Map());
        const subjMap = byStudent.get(row.student_id)!;
        if (!subjMap.has(subject)) {
          subjMap.set(subject, {
            subject,
            year_groups: [],
            topicsSet: new Set(),
            difficulty: 1,
            lesson_count: 0,
          });
        }
        const agg = subjMap.get(subject)!;
        agg.year_groups.push(year);
        topics.forEach((t) => agg.topicsSet.add(String(t).trim()));
        agg.difficulty = Math.max(agg.difficulty, difficulty);
        agg.lesson_count += 1;
      }
    });

    if (byStudent.size === 0) {
      console.log("[weekly-homework-sync] No meaningful homework briefs in window");
      return new Response(
        JSON.stringify({
          success: true,
          week_start: weekStartIso,
          week_end: weekEndIso,
          sent: 0,
          failed: 0,
          skipped: 0,
          note: "No homework briefs found in window",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch student contact info.
    const activeStudentIds = Array.from(byStudent.keys());
    const { data: studentsRows, error: studErr } = await service
      .from("students")
      .select("id, first_name, last_name, email, phone, parent_id")
      .in("id", activeStudentIds);
    if (studErr) throw studErr;

    // Parent contact details (email + phone).
    const parentIds = Array.from(
      new Set((studentsRows ?? []).map((s: any) => s.parent_id).filter(Boolean))
    );
    const parentEmailMap = new Map<string, string>();
    const parentPhoneMap = new Map<string, string>();
    if (parentIds.length > 0) {
      const { data: parentRows } = await service
        .from("parents")
        .select("id, email, phone")
        .in("id", parentIds);
      (parentRows ?? []).forEach((p: any) => {
        if (p.email) parentEmailMap.set(p.id, p.email);
        if (p.phone) parentPhoneMap.set(p.id, p.phone);
      });
    }

    const studentMap = new Map<number, any>();
    (studentsRows ?? []).forEach((s: any) => studentMap.set(s.id, s));

    const notifyEnabled = body.notify !== false && !body.dry_run;
    const syncEnabled = !body.notify_only;
    const delayMs = typeof body.delay_ms === "number" ? body.delay_ms : 5000;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;
    if (notifyEnabled && !resend) {
      console.warn("[weekly-homework-sync] RESEND_API_KEY missing — emails will be skipped");
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let notified = 0;
    let emailsSent = 0;
    let whatsappSent = 0;
    let isFirstStudent = true;

    // -------------------------------------------------------------------------
    // Explicit chunking.
    //
    // Previously the whole queue was processed in one invocation with a 240s
    // wall-clock guard checked *after* each student. The runtime killed the
    // invocation before that guard ever fired, so the tail of the queue was
    // silently dropped (10 Aug 2026: 23 of 50 students synced, no error).
    //
    // Now: each invocation takes a fixed slice, and the remainder is handed to
    // a fresh invocation *before* this batch starts work, so a mid-batch death
    // can no longer take the rest of the queue with it.
    // -------------------------------------------------------------------------
    const batchSize = Math.max(1, Math.min(100, Number(body.batch_size) || 20));
    const queueIds = Array.from(byStudent.keys());
    const batchIds = queueIds.slice(0, batchSize);
    const overflowIds = queueIds.slice(batchSize);
    const isRootRun = !(body.student_ids && body.student_ids.length > 0);

    const contactKeyFor = (studentId: number): string => {
      const s = studentMap.get(studentId);
      if (!s) return `student-${studentId}`;
      const pEmail = s.parent_id ? parentEmailMap.get(s.parent_id) ?? null : null;
      return s.email || pEmail || `student-${s.id}`;
    };

    // Run manifest: on the root invocation, record every eligible student as
    // `queued` up front. Each student flips to sent/failed/skipped as it is
    // processed, so anything left `queued` is visibly unfinished.
    async function manifestQueue(ids: number[]) {
      if (body.dry_run || ids.length === 0) return;
      try {
        await service.from("notifications").insert(
          ids.map((id) => ({
            type: "heycleo_weekly_homework_sync_manifest",
            subject: `${weekStartIso} · queued`,
            email: contactKeyFor(id),
            status: "queued",
          }))
        );
      } catch (err) {
        console.warn("[weekly-homework-sync] manifest insert failed", err);
      }
    }

    async function manifestResolve(studentId: number, status: string, note: string) {
      if (body.dry_run) return;
      try {
        await service
          .from("notifications")
          .update({ status, subject: `${weekStartIso} · ${note}` })
          .eq("type", "heycleo_weekly_homework_sync_manifest")
          .eq("email", contactKeyFor(studentId))
          .eq("subject", `${weekStartIso} · queued`)
          .eq("status", "queued");
      } catch (err) {
        console.warn("[weekly-homework-sync] manifest update failed", err);
      }
    }

    function handOff(ids: number[], reason: string) {
      if (ids.length === 0) return;
      console.log("[weekly-homework-sync] Handing off students", { count: ids.length, reason });
      const p = fetch(`${supabaseUrl}/functions/v1/weekly-homework-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          week_start: weekStartIso,
          student_ids: ids,
          notify: body.notify,
          notify_only: body.notify_only,
          dry_run: body.dry_run,
          delay_ms: delayMs,
          batch_size: batchSize,
        }),
      }).catch((err) => console.error("[weekly-homework-sync] Handoff failed", reason, err));
      try {
        // deno-lint-ignore no-explicit-any
        (globalThis as any).EdgeRuntime?.waitUntil?.(p);
      } catch (_) { /* best-effort */ }
    }

    if (isRootRun) await manifestQueue(queueIds);

    // Kick the remainder off immediately — before this batch does any work.
    handOff(overflowIds, "overflow");

    const runStartedAt = Date.now();
    const maxRunMs = 90000; // second line of defence, well under the runtime limit
    const remainingStudentIds: number[] = [];

    for (const studentId of batchIds) {
      const subjMap = byStudent.get(studentId)!;
      // Safety net: if this batch is somehow running long, hand the rest on.
      if (Date.now() - runStartedAt > maxRunMs) {
        remainingStudentIds.push(studentId);
        continue;
      }


      const student = studentMap.get(studentId);

      if (!student) {
        skipped += 1;
        await manifestResolve(studentId, "skipped", "skipped: no_student_record");
        continue;
      }

      const subjects: SubjectAggregate[] = Array.from(subjMap.values()).map((a) => ({
        subject: a.subject,
        year_group: pickMostCommon(a.year_groups),
        topics: Array.from(a.topicsSet),
        difficulty_tag: a.difficulty,
        lesson_count: a.lesson_count,
      }));

      const totalLessons = subjects.reduce((n, s) => n + s.lesson_count, 0);
      if (subjects.length === 0 || totalLessons === 0) {
        console.log("[weekly-homework-sync] Skipping student — no eligible lessons after filters", { studentId });
        skipped += 1;
        try {
          await service.from("notifications").insert({
            type: "heycleo_weekly_homework_sync",
            subject: `${weekStartIso} · skipped: no_eligible_lessons`,
            email: student.email || `student-${student.id}`,
            status: "skipped",
          });
        } catch (_) { /* best-effort */ }
        await manifestResolve(studentId, "skipped", "skipped: no_eligible_lessons");
        continue;
      }


      const syncId = await sha256Hex(`${studentId}|${weekStartIso}`);
      const parent_email = student.parent_id ? parentEmailMap.get(student.parent_id) ?? null : null;

      const payload = {
        secret: sharedSecret,
        sync_id: syncId,
        week_start: weekStartIso,
        week_end: weekEndIso,
        student: {
          id: student.id,
          first_name: student.first_name ?? "",
          last_name: student.last_name ?? "",
          email: student.email ?? null,
          parent_email,
        },
        subjects,
      };

      const contactEmail = student.email || parent_email || `student-${student.id}`;

      const payloadForLog = { ...payload, secret: "***" };
      console.log("[weekly-homework-sync] Payload", { studentId, contactEmail, payload: payloadForLog });

      if (body.dry_run) {
        console.log("[weekly-homework-sync] DRY RUN", { studentId, subjects: subjects.length, sync_id: syncId });
        skipped += 1;
        continue;
      }


      // Pace requests so we never hit HeyCleo rate limits.
      if (!isFirstStudent && delayMs > 0) {
        await sleep(delayMs);
      }
      isFirstStudent = false;

      let syncOk = true;
      let result = { ok: true, status: 0, body: "skipped" };

      if (syncEnabled) {
        result = await postWithRetry(
          receiverUrl,
          {
            "Content-Type": "application/json",
            "x-heycleo-secret": sharedSecret,
          },
          JSON.stringify(payload)
        );
        syncOk = result.ok;

        if (result.ok) {
          sent += 1;
          console.log("[weekly-homework-sync] Sent", { studentId, contactEmail, status: result.status });
        } else {
          failed += 1;
          console.error("[weekly-homework-sync] Failed", { studentId, contactEmail, status: result.status, body: result.body?.slice(0, 300) });
        }

        // Log outcome for observability (best-effort).
        try {
          await service.from("notifications").insert({
            type: "heycleo_weekly_homework_sync",
            subject: `${weekStartIso} · ${subjects.length} subjects`,
            email: contactEmail,
            status: result.ok ? "sent" : "failed",
          });
        } catch (logErr) {
          console.warn("[weekly-homework-sync] notification log failed", logErr);
        }

        await manifestResolve(
          studentId,
          result.ok ? "sent" : "failed",
          result.ok ? `sent: ${subjects.length} subjects` : `failed: status ${result.status}`
        );
      } else {
        await manifestResolve(studentId, "skipped", "skipped: notify_only");
      }

      // Only announce once the student's homework actually reached HeyCleo.
      if (notifyEnabled && syncOk) {
        const parentPhone = student.parent_id ? parentPhoneMap.get(student.parent_id) ?? null : null;
        const emails = Array.from(
          new Set(
            [student.email, parent_email]
              .filter(Boolean)
              .map((e: string) => e.trim().toLowerCase())
          )
        );
        const phones = Array.from(
          new Set(
            [normalisePhone(student.phone), normalisePhone(parentPhone)].filter(Boolean) as string[]
          )
        );

        if (emails.length === 0 && phones.length === 0) {
          console.warn("[weekly-homework-sync] No contact details for student", { studentId });
        } else {
          try {
            const outcome = await notifyContacts(
              service,
              resend,
              weekStartIso,
              studentId,
              emails,
              phones
            );
            emailsSent += outcome.emailsSent;
            whatsappSent += outcome.whatsappSent;
            if (outcome.emailsSent > 0 || outcome.whatsappSent > 0) notified += 1;
            if (outcome.errors.length > 0) {
              console.error("[weekly-homework-sync] Notification errors", { studentId, errors: outcome.errors });
            }
          } catch (notifyErr) {
            console.error("[weekly-homework-sync] Notification threw", { studentId, notifyErr });
          }
        }
      }
    }

    // Continue the queue in a fresh invocation if we ran out of time.
    handOff(remainingStudentIds, "batch-timeout");




    console.log("[weekly-homework-sync] Done", {
      weekStartIso, sent, failed, skipped, notified, emailsSent, whatsappSent,
      queueSize: queueIds.length, batch: batchIds.length, handedOff: overflowIds.length + remainingStudentIds.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        week_start: weekStartIso,
        week_end: weekEndIso,
        sent,
        failed,
        skipped,
        notified,
        emails_sent: emailsSent,
        whatsapp_sent: whatsappSent,
        queue_size: queueIds.length,
        batch_size: batchIds.length,
        handed_off: overflowIds.length + remainingStudentIds.length,
        eligible_student_ids: body.dry_run ? queueIds : undefined,
      }),

      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[weekly-homework-sync] Error", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
