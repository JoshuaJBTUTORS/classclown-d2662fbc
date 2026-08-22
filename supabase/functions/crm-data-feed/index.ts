import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const WEEKS_PER_MONTH = 4.33;

function contractMonths(term: string | null): number {
  const t = (term || "").toLowerCase();
  if (t.includes("12")) return 12;
  if (t.includes("3")) return 3;
  return 1; // month-to-month / unspecified
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeDealSize(proposal: any) {
  const price = Number(proposal.price_per_lesson) || 0;
  const times = Array.isArray(proposal.lesson_times) ? proposal.lesson_times : [];
  const sessionsPerWeek = times.length || 1;
  const weekly = price * sessionsPerWeek;
  const monthly = weekly * WEEKS_PER_MONTH;
  const months = contractMonths(proposal.contract_term);
  return {
    currency: "GBP",
    price_per_lesson: price,
    sessions_per_week: sessionsPerWeek,
    weekly_value: round2(weekly),
    monthly_value: round2(monthly),
    contract_months: months,
    contract_value: round2(monthly * months),
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const expectedKey = Deno.env.get("CRM_FEED_API_KEY");
  const providedKey =
    req.headers.get("x-api-key") ||
    new URL(req.url).searchParams.get("api_key") ||
    "";

  if (!expectedKey || providedKey !== expectedKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") || "all").toLowerCase();
  const sinceParam = url.searchParams.get("since");
  const limitParam = Number(url.searchParams.get("limit") || 100);
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1), 500);

  let since: string | null = null;
  if (sinceParam) {
    const d = new Date(sinceParam);
    if (isNaN(d.getTime())) {
      return json({ error: "Invalid 'since' timestamp. Use ISO 8601." }, 400);
    }
    since = d.toISOString();
  }

  if (!["all", "trial_bookings", "proposals"].includes(type)) {
    return json(
      { error: "Invalid 'type'. Use trial_bookings, proposals, or all." },
      400,
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const result: Record<string, unknown> = { generated_at: new Date().toISOString() };

    if (type === "all" || type === "trial_bookings") {
      let q = supabase
        .from("trial_bookings")
        .select(
          "id, parent_name, child_name, email, phone, preferred_date, preferred_time, lesson_time, status, booking_source, referral_code, message, is_unique_booking, created_at, updated_at, subject_id, year_group_id",
        )
        .order("updated_at", { ascending: true })
        .limit(limit);

      if (since) q = q.gt("updated_at", since);

      const { data, error } = await q;
      if (error) throw error;

      const rows = data || [];
      const subjectIds = [...new Set(rows.map((r) => r.subject_id).filter(Boolean))];
      const yearGroupIds = [...new Set(rows.map((r) => r.year_group_id).filter(Boolean))];

      const [subjectsRes, yearGroupsRes] = await Promise.all([
        subjectIds.length
          ? supabase.from("subjects").select("id, name").in("id", subjectIds)
          : Promise.resolve({ data: [] as any[] }),
        yearGroupIds.length
          ? supabase.from("year_groups").select("id, name").in("id", yearGroupIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const subjectMap = new Map(
        (subjectsRes.data || []).map((s: any) => [s.id, s.name]),
      );
      const yearGroupMap = new Map(
        (yearGroupsRes.data || []).map((y: any) => [y.id, y.name]),
      );

      const bookings = rows.map((r) => ({
        id: r.id,
        parent_name: r.parent_name,
        child_name: r.child_name,
        email: r.email,
        phone: r.phone,
        subject: subjectMap.get(r.subject_id) ?? null,
        year_group: yearGroupMap.get(r.year_group_id) ?? null,
        preferred_date: r.preferred_date,
        preferred_time: r.preferred_time,
        lesson_time: r.lesson_time,
        status: r.status,
        booking_source: r.booking_source,
        referral_code: r.referral_code,
        message: r.message,
        is_unique_booking: r.is_unique_booking,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      result.trial_bookings = {
        records: bookings,
        count: bookings.length,
        has_more: bookings.length === limit,
        next_since: rows.length ? rows[rows.length - 1].updated_at : since,
      };
    }

    if (type === "all" || type === "proposals") {
      let q = supabase
        .from("lesson_proposals")
        .select(
          "id, recipient_name, recipient_email, recipient_phone, subject, lesson_type, price_per_lesson, payment_cycle, contract_term, lesson_times, daily_homework_opt_in, status, created_at, agreed_at, completed_at, updated_at",
        )
        .eq("status", "completed")
        .order("updated_at", { ascending: true })
        .limit(limit);

      if (since) q = q.gt("updated_at", since);

      const { data, error } = await q;
      if (error) throw error;

      const rows = data || [];
      const proposals = rows.map((p) => ({
        id: p.id,
        recipient_name: p.recipient_name,
        email: p.recipient_email,
        phone: p.recipient_phone,
        subject: p.subject,
        lesson_type: p.lesson_type,
        payment_cycle: p.payment_cycle,
        contract_term: p.contract_term,
        lesson_times: p.lesson_times,
        daily_homework_opt_in: p.daily_homework_opt_in,
        deal: computeDealSize(p),
        status: p.status,
        created_at: p.created_at,
        agreed_at: p.agreed_at,
        completed_at: p.completed_at,
        updated_at: p.updated_at,
      }));

      result.proposals = {
        records: proposals,
        count: proposals.length,
        has_more: proposals.length === limit,
        next_since: rows.length ? rows[rows.length - 1].updated_at : since,
      };
    }

    return json(result);
  } catch (err: any) {
    console.error("crm-data-feed error:", err);
    return json({ error: err?.message || "Unexpected error" }, 500);
  }
});
