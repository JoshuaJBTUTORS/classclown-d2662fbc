import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface Body {
  mode: "student" | "tutor";
  studentId?: number;
  tutorId?: string;
  dryRun?: boolean;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const todayIso = () => new Date().toISOString().slice(0, 10);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authorization header required" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Invalid or expired token" }, 401);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "owner"])
      .maybeSingle();
    if (!roleData) return json({ error: "Admin role required" }, 403);

    const body = (await req.json()) as Body;
    const dryRun = body.dryRun === true;
    const nowIso = new Date().toISOString();

    // ---- Collect the future lessons affected -------------------------------
    let futureLessonIds: string[] = [];

    if (body.mode === "student") {
      if (!body.studentId) return json({ error: "studentId required" }, 400);

      const { data: links, error: linkErr } = await supabase
        .from("lesson_students")
        .select("lesson_id, lessons!inner(id, start_time, status, parent_lesson_id)")
        .eq("student_id", body.studentId)
        .gt("lessons.start_time", nowIso);
      if (linkErr) throw linkErr;

      futureLessonIds = (links ?? [])
        .filter((l: any) => (l.lessons?.status ?? "scheduled") !== "cancelled")
        .map((l: any) => l.lesson_id);
    } else if (body.mode === "tutor") {
      if (!body.tutorId) return json({ error: "tutorId required" }, 400);

      const { data: lessons, error: lessonErr } = await supabase
        .from("lessons")
        .select("id, status")
        .eq("tutor_id", body.tutorId)
        .gt("start_time", nowIso);
      if (lessonErr) throw lessonErr;

      futureLessonIds = (lessons ?? [])
        .filter((l: any) => (l.status ?? "scheduled") !== "cancelled")
        .map((l: any) => l.id);
    } else {
      return json({ error: "mode must be 'student' or 'tutor'" }, 400);
    }

    if (dryRun) return json({ affectedLessons: futureLessonIds.length });

    // ---- Stop the recurring series ----------------------------------------
    // Every parent series touched by these lessons gets a hard stop from today.
    const parentIds = new Set<string>();
    if (futureLessonIds.length > 0) {
      const { data: lessonRows } = await supabase
        .from("lessons")
        .select("id, parent_lesson_id, is_recurring")
        .in("id", futureLessonIds);
      for (const l of lessonRows ?? []) {
        const pid = (l as any).parent_lesson_id ?? ((l as any).is_recurring ? (l as any).id : null);
        if (pid) parentIds.add(pid);
      }
    }

    for (const parentId of parentIds) {
      await supabase.from("recurring_lesson_cancellations").insert({
        parent_lesson_id: parentId,
        cancelled_from: todayIso(),
      });
      await supabase
        .from("recurring_lesson_groups")
        .update({
          next_extension_date: new Date(Date.now() + 100 * 365 * 24 * 3600 * 1000).toISOString(),
          instances_generated_until: nowIso,
          updated_at: nowIso,
        })
        .eq("original_lesson_id", parentId);
    }

    // ---- Remove the person from future lessons ----------------------------
    let cancelled = 0;
    let detached = 0;

    if (body.mode === "student") {
      for (const lessonId of futureLessonIds) {
        const { count } = await supabase
          .from("lesson_students")
          .select("student_id", { count: "exact", head: true })
          .eq("lesson_id", lessonId);

        await supabase
          .from("lesson_students")
          .delete()
          .eq("lesson_id", lessonId)
          .eq("student_id", body.studentId!);
        detached++;

        if ((count ?? 0) <= 1) {
          await supabase.from("lessons").update({ status: "cancelled" }).eq("id", lessonId);
          cancelled++;
        }
      }

      await supabase.from("students").update({ status: "stopped" }).eq("id", body.studentId!);
    } else {
      if (futureLessonIds.length > 0) {
        await supabase.from("lessons").update({ status: "cancelled" }).in("id", futureLessonIds);
        cancelled = futureLessonIds.length;
      }
      await supabase.from("tutors").update({ status: "inactive" }).eq("id", body.tutorId!);
    }

    return json({
      success: true,
      cancelledLessons: cancelled,
      detachedLessons: detached,
      stoppedSeries: parentIds.size,
    });
  } catch (err: any) {
    console.error("stop-lessons error", err);
    return json({ error: err?.message || "Unexpected error" }, 500);
  }
});
