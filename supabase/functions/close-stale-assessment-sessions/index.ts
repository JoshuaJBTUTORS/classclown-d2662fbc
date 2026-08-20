import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// A student who has stopped answering for this long has almost certainly
// finished (or abandoned) the paper without pressing submit.
const STALE_HOURS = 48;

type Admin = ReturnType<typeof createClient>;

/**
 * Marks the session completed and makes sure an assignment row exists in the
 * `submitted` state, so the attempt shows up in the normal review queue.
 */
async function submitSession(supabase: Admin, sessionId: string) {
  const { data: session, error } = await supabase
    .from("assessment_sessions")
    .select("id, assessment_id, user_id, status, completed_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!session) throw new Error("Session not found");

  const now = new Date().toISOString();

  if (session.status !== "completed" || !session.completed_at) {
    const { error: sessionError } = await supabase
      .from("assessment_sessions")
      .update({ status: "completed", completed_at: session.completed_at ?? now })
      .eq("id", session.id);
    if (sessionError) throw sessionError;
  }

  const { data: assignment } = await supabase
    .from("assessment_assignments")
    .select("id, status")
    .eq("assessment_id", session.assessment_id)
    .eq("assigned_to", session.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignment) {
    if (assignment.status !== "submitted" && assignment.status !== "reviewed") {
      const { error: updateError } = await supabase
        .from("assessment_assignments")
        .update({ status: "submitted", submitted_at: now })
        .eq("id", assignment.id);
      if (updateError) throw updateError;
    }
    return { sessionId: session.id, assignmentId: assignment.id, created: false };
  }

  // Self-started attempts have no assignment row at all; create one so the
  // work becomes visible in the admin review queue.
  const { data: created, error: insertError } = await supabase
    .from("assessment_assignments")
    .insert({
      assessment_id: session.assessment_id,
      assigned_to: session.user_id,
      assigned_by: session.user_id,
      status: "submitted",
      submitted_at: now,
      notes: "Auto-submitted: attempt was completed but never submitted by the student.",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return { sessionId: session.id, assignmentId: created.id, created: true };
}

/** Finds sessions that hold real answers but never reached the submitted state. */
async function findStaleSessions(supabase: Admin, cutoffIso: string) {
  const { data: sessions, error } = await supabase
    .from("assessment_sessions")
    .select("id, assessment_id, user_id, status, started_at")
    .in("status", ["in_progress", "completed"])
    .limit(2000);

  if (error) throw error;

  const stale: string[] = [];

  for (const session of sessions ?? []) {
    const { data: responses } = await supabase
      .from("student_responses")
      .select("student_answer, submitted_at, updated_at")
      .eq("session_id", session.id);

    const answered = (responses ?? []).filter((r: any) => (r.student_answer ?? "").trim() !== "");
    if (answered.length === 0) continue;

    const lastActivity = answered
      .map((r: any) => r.submitted_at ?? r.updated_at)
      .filter(Boolean)
      .sort()
      .pop();
    if (lastActivity && lastActivity > cutoffIso) continue;

    const { data: assignment } = await supabase
      .from("assessment_assignments")
      .select("status")
      .eq("assessment_id", session.assessment_id)
      .eq("assigned_to", session.user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assignment?.status === "submitted" || assignment?.status === "reviewed") continue;
    stale.push(session.id);
  }

  return stale;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    let body: any = {};
    try {
      body = await req.json();
    } catch (_e) {
      body = {};
    }

    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;

    // Acting on a single named session is an admin action and needs a real
    // admin JWT. The unattended sweep runs from cron with no user attached.
    if (sessionId) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) return json({ success: false, error: "Missing authorization header" }, 401);
      const token = authHeader.replace("Bearer ", "").trim();

      if (token !== serviceRoleKey) {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return json({ success: false, error: "Unauthorized" }, 401);

        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        const isAdmin = roles?.some((r: any) => r.role === "admin" || r.role === "owner");
        if (!isAdmin) return json({ success: false, error: "Admin or owner role required" }, 403);
      }

      const result = await submitSession(supabase, sessionId);
      return json({ success: true, ...result });
    }

    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();
    const stale = await findStaleSessions(supabase, cutoff);

    const submitted: string[] = [];
    const failures: { sessionId: string; error: string }[] = [];

    for (const id of stale) {
      try {
        await submitSession(supabase, id);
        submitted.push(id);
      } catch (error: any) {
        failures.push({ sessionId: id, error: error?.message ?? String(error) });
      }
    }

    console.log(`Stale sweep: submitted ${submitted.length}, failed ${failures.length}`);
    return json({ success: true, submitted: submitted.length, failed: failures.length, failures });
  } catch (error: any) {
    console.error("close-stale-assessment-sessions error", error);
    return json({ success: false, error: error?.message ?? "Unexpected error" }, 500);
  }
});
