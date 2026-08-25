import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";
import { whatsappService } from "../_shared/whatsapp-service.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Homework nudge reminders (Wednesday + Friday)
 *
 * For every student with lessons in the current London week, checks whether
 * this week's and last week's HeyCleo homework is complete and sends the most
 * appropriate plain text nudge by WhatsApp and email.
 *
 * Body (all optional):
 *   { dry_run?: boolean, as_of?: "YYYY-MM-DD", student_ids?: number[],
 *     force?: boolean }   // ignore the Wednesday/Friday guard
 */

const SUBJECT = "Homework reminder";

const MSG = {
  wedCurrent: (days: number) =>
    `Hello. This is a reminder that your child has ${days} ${days === 1 ? "day" : "days"} left to complete this week's homework. Please log on to classclowncrm.com and head to HeyCleo to complete the homework.`,
  wedBoth:
    "Hello. This is a reminder that your child's homework due from last week has not yet been completed. Please note that failure to complete can result in restricted access from future lessons as this is a requirement to ensure we can best support your child.",
  friCurrent:
    "Hello. This is just a reminder that your child's homework is due today. Please let us know if you are having difficulty completing this week's homework.",
  friBoth:
    "Hello. This is a reminder that your child has not yet completed this week and last week's homework. Please note that failure to complete homework can result in restricted access as this is a requirement to ensure we can best support your child.",
};

function londonParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return {
    weekday: String(parts.weekday),
    hour: Number(parts.hour),
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

// Monday 00:00 (London wall clock, treated as UTC-ish date arithmetic) of the week containing d.
function mondayOf(dateIso: string): Date {
  const d = new Date(`${dateIso}T00:00:00Z`);
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalisePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  if (!trimmed) return null;
  return whatsappService.formatPhoneNumber(trimmed);
}

const norm = (v?: string | null) => (v ? v.toLowerCase().trim() : "");

function emailHtml(text: string): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f6f7f9;padding:24px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a">Class Beyond Academy</h2>
    <p style="font-size:15px;line-height:24px;color:#334155;white-space:pre-line;margin:0 0 20px">${text}</p>
    <p style="font-size:14px;color:#64748b;margin:0">Class Beyond Academy</p>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const service = createClient(supabaseUrl, serviceKey);

    let body: {
      dry_run?: boolean;
      as_of?: string;
      student_ids?: number[];
      force?: boolean;
      delay_ms?: number;
    } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const now = new Date();
    const parts = londonParts(now);
    const todayIso = body.as_of ?? parts.date;
    const runWeekday = body.as_of
      ? new Date(`${todayIso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short" })
      : parts.weekday;

    const isWednesday = runWeekday.startsWith("Wed");
    const isFriday = runWeekday.startsWith("Fri");

    if (!isWednesday && !isFriday && !body.force) {
      console.log("[homework-nudge] Not a Wednesday or Friday, exiting", { runWeekday });
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "not a nudge day", weekday: runWeekday }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const thisMonday = mondayOf(todayIso);
    const nextMonday = new Date(thisMonday);
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
    const lastMonday = new Date(thisMonday);
    lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);

    // Friday deadline of the current week.
    const friday = new Date(thisMonday);
    friday.setUTCDate(friday.getUTCDate() + 4);
    const daysLeft = Math.max(
      0,
      Math.round((friday.getTime() - new Date(`${todayIso}T00:00:00Z`).getTime()) / 86400000)
    );

    console.log("[homework-nudge] Run", {
      todayIso,
      runWeekday,
      thisWeek: toIsoDate(thisMonday),
      lastWeek: toIsoDate(lastMonday),
      dryRun: !!body.dry_run,
    });

    // 1. Students with lessons in the current week.
    const { data: weekLessons, error: lessonErr } = await service
      .from("lessons")
      .select("id, status, start_time, lesson_students(student_id)")
      .gte("start_time", thisMonday.toISOString())
      .lt("start_time", nextMonday.toISOString())
      .neq("status", "cancelled");
    if (lessonErr) throw lessonErr;

    const studentIdsWithLessons = new Set<number>();
    (weekLessons ?? []).forEach((l: any) => {
      (l.lesson_students ?? []).forEach((ls: any) => {
        if (typeof ls.student_id === "number") studentIdsWithLessons.add(ls.student_id);
      });
    });

    let candidateIds = Array.from(studentIdsWithLessons);
    if (body.student_ids?.length) {
      const filter = new Set(body.student_ids);
      candidateIds = candidateIds.filter((id) => filter.has(id));
    }

    if (candidateIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, considered: 0, note: "No students with lessons this week" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Contacts.
    const { data: studentRows, error: studErr } = await service
      .from("students")
      .select("id, first_name, last_name, email, phone, whatsapp_number, parent_id, status")
      .in("id", candidateIds);
    if (studErr) throw studErr;

    const students = (studentRows ?? []).filter(
      (s: any) => !s.status || String(s.status).toLowerCase() !== "inactive"
    );

    const parentIds = Array.from(new Set(students.map((s: any) => s.parent_id).filter(Boolean)));
    const parents = new Map<string, any>();
    const siblingCount = new Map<string, number>();
    if (parentIds.length) {
      const [{ data: parentRows }, { data: siblings }] = await Promise.all([
        service.from("parents").select("id, email, phone, whatsapp_number").in("id", parentIds),
        service.from("students").select("id, parent_id").in("parent_id", parentIds),
      ]);
      (parentRows ?? []).forEach((p: any) => parents.set(p.id, p));
      (siblings ?? []).forEach((s: any) => {
        if (!s.parent_id) return;
        siblingCount.set(s.parent_id, (siblingCount.get(s.parent_id) ?? 0) + 1);
      });
    }

    // 3. Link to HeyCleo accounts by email.
    const { data: heycleoStudents, error: hcErr } = await service
      .from("heycleo_students")
      .select("student_id, email")
      .limit(5000);
    if (hcErr) throw hcErr;

    const byEmail = new Map<string, string>();
    (heycleoStudents ?? []).forEach((h: any) => {
      const key = norm(h.email);
      if (key && !byEmail.has(key)) byEmail.set(key, h.student_id);
    });

    const linked = new Map<number, string>();
    students.forEach((s: any) => {
      const direct = byEmail.get(norm(s.email));
      if (direct) {
        linked.set(s.id, direct);
        return;
      }
      const parent = s.parent_id ? parents.get(s.parent_id) : null;
      if (parent && (siblingCount.get(s.parent_id) ?? 0) === 1) {
        const viaParent = byEmail.get(norm(parent.email));
        if (viaParent) linked.set(s.id, viaParent);
      }
    });

    const heycleoIds = Array.from(new Set(linked.values()));
    if (heycleoIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, considered: students.length, note: "No linked HeyCleo accounts" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Homework rows for both weeks.
    const { data: homework, error: hwErr } = await service
      .from("heycleo_homework_completion")
      .select("student_id, due_date, completed")
      .in("student_id", heycleoIds)
      .gte("due_date", lastMonday.toISOString())
      .lt("due_date", nextMonday.toISOString())
      .limit(5000);
    if (hwErr) throw hwErr;

    type WeekState = { due: number; outstanding: number };
    const stateByHeycleo = new Map<string, { current: WeekState; previous: WeekState }>();
    const blank = () => ({ current: { due: 0, outstanding: 0 }, previous: { due: 0, outstanding: 0 } });

    (homework ?? []).forEach((h: any) => {
      if (!h.student_id || !h.due_date) return;
      const due = new Date(h.due_date);
      const bucket = due >= thisMonday ? "current" : "previous";
      if (!stateByHeycleo.has(h.student_id)) stateByHeycleo.set(h.student_id, blank());
      const st = stateByHeycleo.get(h.student_id)![bucket as "current" | "previous"];
      st.due += 1;
      if (!h.completed) st.outstanding += 1;
    });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const resend = resendKey ? new Resend(resendKey) : null;
    const delayMs = typeof body.delay_ms === "number" ? body.delay_ms : 1500;

    const results: any[] = [];
    let emailsSent = 0;
    let whatsappSent = 0;

    for (const student of students) {
      const heycleoId = linked.get(student.id);
      if (!heycleoId) {
        results.push({ student_id: student.id, skipped: "no heycleo account" });
        continue;
      }
      const state = stateByHeycleo.get(heycleoId) ?? blank();
      const currentOutstanding = state.current.outstanding > 0;
      const lastOutstanding = state.previous.outstanding > 0;

      if (!currentOutstanding && !lastOutstanding) {
        results.push({ student_id: student.id, skipped: "all homework complete" });
        continue;
      }

      let text: string;
      let variant: string;
      if (isFriday) {
        if (lastOutstanding) {
          text = MSG.friBoth;
          variant = "friday_both";
        } else {
          text = MSG.friCurrent;
          variant = "friday_current";
        }
      } else {
        if (lastOutstanding) {
          text = MSG.wedBoth;
          variant = "wednesday_last_week";
        } else {
          text = MSG.wedCurrent(daysLeft);
          variant = "wednesday_current";
        }
      }

      // Parent contacts, falling back to the student's own details.
      const parent = student.parent_id ? parents.get(student.parent_id) : null;
      const email = parent?.email || student.email || null;
      const phone = normalisePhone(parent?.whatsapp_number || parent?.phone || student.whatsapp_number || student.phone);

      const outcome: any = { student_id: student.id, variant, email, phone, sent: [] as string[] };

      if (body.dry_run) {
        outcome.dry_run = true;
        results.push(outcome);
        continue;
      }

      // Email
      if (email && resend) {
        const logKey = `email:${email}`;
        const { data: existing } = await service
          .from("notifications")
          .select("id")
          .eq("type", "homework_nudge")
          .eq("email", logKey)
          .eq("subject", todayIso)
          .eq("status", "sent")
          .limit(1);
        if (existing && existing.length > 0) {
          outcome.email_skipped = "already sent today";
        } else {
          try {
            const { error } = await resend.emails.send({
              from: "Class Beyond Academy <enquiries@classbeyondacademy.io>",
              to: [email],
              subject: SUBJECT,
              html: emailHtml(text),
              text,
            });
            if (error) throw new Error(typeof error === "string" ? error : JSON.stringify(error));
            emailsSent += 1;
            outcome.sent.push("email");
            await service.from("notifications").insert({
              type: "homework_nudge",
              subject: todayIso,
              email: logKey,
              status: "sent",
              message: variant,
            });
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[homework-nudge] Email failed", { studentId: student.id, email, msg });
            outcome.email_error = msg;
            await service.from("notifications").insert({
              type: "homework_nudge",
              subject: todayIso,
              email: logKey,
              status: "failed",
              message: variant,
            });
          }
        }
      } else if (email && !resend) {
        outcome.email_error = "RESEND_API_KEY not configured";
      }

      // WhatsApp
      if (phone) {
        const logKey = `whatsapp:${phone}`;
        const { data: existing } = await service
          .from("notifications")
          .select("id")
          .eq("type", "homework_nudge")
          .eq("email", logKey)
          .eq("subject", todayIso)
          .eq("status", "sent")
          .limit(1);
        if (existing && existing.length > 0) {
          outcome.whatsapp_skipped = "already sent today";
        } else {
          const result = await whatsappService.sendMessage({ phoneNumber: phone, text });
          if (result.success) {
            whatsappSent += 1;
            outcome.sent.push("whatsapp");
          } else {
            outcome.whatsapp_error = result.error;
            console.error("[homework-nudge] WhatsApp failed", { studentId: student.id, phone, error: result.error });
          }
          await service.from("notifications").insert({
            type: "homework_nudge",
            subject: todayIso,
            email: logKey,
            status: result.success ? "sent" : "failed",
            message: variant,
          });
        }
      }

      results.push(outcome);
      await sleep(delayMs);
    }

    const summary = {
      success: true,
      run_date: todayIso,
      weekday: runWeekday,
      considered: students.length,
      messaged: results.filter((r) => r.sent?.length).length,
      emails_sent: emailsSent,
      whatsapp_sent: whatsappSent,
      dry_run: !!body.dry_run,
      results,
    };
    console.log("[homework-nudge] Done", {
      considered: summary.considered,
      messaged: summary.messaged,
      emailsSent,
      whatsappSent,
    });

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[homework-nudge] Error", error);
    return new Response(JSON.stringify({ success: false, error: error?.message ?? String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
