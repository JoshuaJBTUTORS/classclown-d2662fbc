import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = (Deno.env.get("HEYCLEO_PULL_URL") ?? "").replace(/\/$/, "");
const KEY = Deno.env.get("HEYCLEO_PULL_KEY") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

type Row = Record<string, unknown>;

async function pull(resource: string, since: string | null) {
  const rows: Row[] = [];
  let cursor: string | null = null;
  let serverTime: string | null = null;

  do {
    const url = new URL(`${BASE}/${resource}`);
    url.searchParams.set("limit", "500");
    if (cursor) url.searchParams.set("cursor", cursor);
    else if (since) url.searchParams.set("since", since);

    const res = await fetch(url.toString(), { headers: { "x-external-key": KEY } });
    if (!res.ok) {
      throw new Error(`[${res.status}] ${await res.text()}`);
    }
    const body = await res.json();
    serverTime ??= body.server_time ?? null;
    if (Array.isArray(body.data)) rows.push(...body.data);
    cursor = body.next_cursor ?? null;
  } while (cursor);

  return { rows, serverTime };
}

function pick(row: Row, keys: string[]) {
  const out: Row = {};
  for (const k of keys) if (row[k] !== undefined) out[k] = row[k];
  return out;
}

const STUDENT_KEYS = [
  "student_id", "first_name", "last_name", "email", "year_group", "education_level",
  "exam_year", "exam_month", "working_grade", "target_grade", "school_id", "tutor_ids",
  "live_tuition_since", "source_created_at", "source_updated_at",
];

const HOMEWORK_KEYS = [
  "assignment_id", "homework_id", "student_id", "title", "subject", "year_group",
  "assessment_type", "tutor_id", "due_date", "status", "started", "completed",
  "assigned_at", "started_at", "submitted_at", "marks_awarded", "marks_available",
  "percentage", "source_updated_at",
];

async function syncResource(
  supabase: ReturnType<typeof createClient>,
  resource: "students" | "homework-completion",
  full = true,
) {
  const table = resource === "students" ? "heycleo_students" : "heycleo_homework_completion";
  const pk = resource === "students" ? "student_id" : "assignment_id";
  const keys = resource === "students" ? STUDENT_KEYS : HOMEWORK_KEYS;

  const { data: state } = await supabase
    .from("heycleo_sync_state")
    .select("last_server_time")
    .eq("resource", resource)
    .maybeSingle();

  const since = full ? null : ((state?.last_server_time as string | null) ?? null);

  try {
    // Current row count, used as the sanity baseline before we prune anything.
    const { count: existingCount } = await supabase
      .from(table)
      .select(pk, { count: "exact", head: true });
    const baseline = existingCount ?? 0;

    const { rows, serverTime } = await pull(resource, since);
    const runStamp = new Date().toISOString();

    // Guard: on a full pull, an empty or implausibly small payload means an upstream
    // problem, not a genuine wipe. Skip the write + prune entirely and flag it.
    if (full && baseline > 0 && rows.length < Math.ceil(baseline * 0.5)) {
      const warning =
        `implausible payload: got ${rows.length} rows, currently store ${baseline} — skipped upsert and prune`;
      console.warn(`[heycleo-pull] ${resource}: ${warning}`);
      await supabase.from("heycleo_sync_state").upsert({
        resource,
        last_server_time: state?.last_server_time ?? null,
        last_run_at: runStamp,
        last_status: "warning",
        last_error: warning,
        rows_synced: 0,
        rows_pruned: 0,
      }, { onConflict: "resource" });
      return { resource, rows: 0, pruned: 0, status: "warning", error: warning };
    }

    let upserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500)
        .map((r) => ({ ...pick(r, keys), synced_at: runStamp }))
        .filter((r) => r[pk]);
      if (!chunk.length) continue;
      const { error } = await supabase.from(table).upsert(chunk, { onConflict: pk });
      if (error) throw new Error(`upsert failed: ${error.message}`);
      upserted += chunk.length;
    }

    // On a full pull, anything HeyCleo no longer returns has been deleted upstream.
    let pruned = 0;
    if (full && upserted > 0) {
      const { data: removed, error: pruneError } = await supabase
        .from(table)
        .delete()
        .lt("synced_at", runStamp)
        .select(pk);
      if (pruneError) throw new Error(`prune failed: ${pruneError.message}`);
      pruned = removed?.length ?? 0;
      if (pruned) console.log(`[heycleo-pull] ${resource}: pruned ${pruned} stale rows`);
    }


    await supabase.from("heycleo_sync_state").upsert({
      resource,
      last_server_time: serverTime ?? since,
      last_run_at: new Date().toISOString(),
      last_status: "success",
      last_error: null,
      rows_synced: upserted,
      rows_pruned: pruned,
    }, { onConflict: "resource" });

    console.log(`[heycleo-pull] ${resource}: ${upserted} rows, ${pruned} pruned (full=${full})`);
    return { resource, rows: upserted, pruned, server_time: serverTime, status: "success" };

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[heycleo-pull] ${resource} failed:`, message);
    // Keep last_server_time untouched so the next run retries the same window.
    await supabase.from("heycleo_sync_state").upsert({
      resource,
      last_server_time: since,
      last_run_at: new Date().toISOString(),
      last_status: "error",
      last_error: message.slice(0, 500),
    }, { onConflict: "resource" });
    return { resource, rows: 0, pruned: 0, status: "error", error: message };
  }
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (!BASE || !KEY) {
    return json({ error: "HEYCLEO_PULL_URL / HEYCLEO_PULL_KEY not configured" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  let resource = "all";
  // Authoritative by default: pull everything and prune what HeyCleo no longer sends.
  // Pass { "full": false } explicitly for a cursor-based incremental pull (debugging only).
  let full = true;
  try {
    const body = await req.json();
    if (body?.resource) resource = String(body.resource);
    if (body?.full === false) full = false;
  } catch {
    // no body -> default to a full pull of all resources (cron invocations)
  }


  // Manual (browser) invocations carry a user JWT: require admin/owner.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (token && token !== anonKey && token !== SERVICE_ROLE) {
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const allowed = (roles ?? []).some((r: { role: string }) => r.role === "admin" || r.role === "owner");
    if (!allowed) return json({ error: "Forbidden" }, 403);
  }

  const resources: ("students" | "homework-completion")[] =
    resource === "all"
      ? ["students", "homework-completion"]
      : resource === "students" || resource === "homework-completion"
        ? [resource]
        : [];

  if (!resources.length) return json({ error: `Unknown resource: ${resource}` }, 400);

  const results = [];
  for (const r of resources) {
    results.push(await syncResource(supabase, r, full));
  }

  const hasError = results.some((r) => r.status === "error");
  return json({ ok: !hasError, results }, hasError ? 207 : 200);
});
